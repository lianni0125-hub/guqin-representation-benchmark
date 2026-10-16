"""Run frozen R0-R5 grouped representation models on restricted GQ39 tables."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from fractions import Fraction
from pathlib import Path

import numpy as np
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import LogisticRegression

from src.research_metrics import (
    binary_average_precision,
    classification_metrics,
    multiclass_brier,
    negative_log_likelihood,
    piece_macro_mean,
)

ROOT = Path(__file__).resolve().parents[1]
C_GRID = [0.01, 0.1, 1.0, 10.0]
SEED = 20261016
TARGETS = {
    "T1": {
        "file": "t1_performed_lh_motion.jsonl",
        "labels": ["stationary_press", "continuous_oscillation", "upward_motion", "downward_motion", "up_return", "down_return"],
    },
    "T2": {
        "file": "t2_score_rh_attack_eligible.jsonl",
        "labels": ["single_note_attack", "multi_note_attack"],
    },
}

T1_RETURN_MERGE = {"up_return": "return_motion", "down_return": "return_motion"}


def read_rows(target: str) -> list[dict]:
    path = ROOT / "data" / "interim" / "gq39_analysis_v1" / TARGETS[target]["file"]
    with path.open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def apply_target_sensitivity(target: str, rows: list[dict], target_sensitivity: str | None) -> list[str]:
    if target_sensitivity is None:
        return TARGETS[target]["labels"]
    if target != "T1" or target_sensitivity != "merge_returns":
        raise ValueError("merge_returns is defined only for T1")
    for row in rows:
        row["target_class"] = T1_RETURN_MERGE.get(row["target_class"], row["target_class"])
    return ["stationary_press", "continuous_oscillation", "upward_motion", "downward_motion", "return_motion"]


def numeric(value) -> float:
    try:
        return float(Fraction(str(value)))
    except (ValueError, ZeroDivisionError):
        return 0.0


def add_position_norm(rows: list[dict]) -> None:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[row["sequence_id"]].append(row)
    for sequence_rows in grouped.values():
        onsets = [numeric(row["predictors"].get("score_onset")) for row in sequence_rows]
        low, high = min(onsets), max(onsets)
        for row, onset in zip(sequence_rows, onsets):
            row["_position_norm"] = (onset - low) / (high - low) if high > low else 0.0


def value(value) -> str:
    return "MISSING" if value is None or value == "" else str(value)


def raw_tuple(target: str, row: dict) -> str:
    p = row["predictors"]
    if target == "T1":
        fields = [p.get("degree"), p.get("range"), row.get("target_raw")]
    else:
        fields = [p.get("degree"), p.get("range"), p.get("string"), p.get("position"), p.get("right_finger_raw"),
                  p.get("left_pitch_tech_raw"), p.get("left_timbre_tech_raw"), row.get("target_raw")]
    return "|".join(value(field) for field in fields)


def atoms(raw) -> list[str]:
    text = value(raw)
    if text == "MISSING":
        return [text]
    return [part.strip() for part in text.replace(".", ",").split(",") if part.strip()]


def unresolved(raw, opaque: bool) -> str:
    return f"OPAQUE:{value(raw)}" if opaque else "PREV_UNRESOLVED"


def left_pitch_supercategory(raw, opaque: bool = False) -> str:
    mapped = []
    for atom in atoms(raw):
        if atom == "MISSING":
            mapped.append("MISSING")
        elif atom == "1":
            mapped.append("stationary_press")
        elif atom == "2":
            mapped.append("continuous_oscillation")
        elif atom.startswith("3"):
            mapped.append("upward_motion")
        elif atom.startswith("4") and atom in {"4", "4a", "4b", "4c"}:
            mapped.append("downward_motion")
        elif atom.startswith("5") and atom in {"5", "5a", "5b", "5c", "5d"}:
            mapped.append("up_return")
        elif atom in {"6", "6a"}:
            mapped.append("down_return")
        else:
            return unresolved(raw, opaque)
    return "+".join(mapped)


def left_timbre_supercategory(raw, opaque: bool = False) -> str:
    mapping = {"1": "harmonic", "2": "open_string", "3": "ordinary_stopped", "4": "special_stopped"}
    mapped = []
    for atom in atoms(raw):
        if atom == "MISSING":
            mapped.append("MISSING")
        elif atom in mapping:
            mapped.append(mapping[atom])
        else:
            return unresolved(raw, opaque)
    return "+".join(mapped)


def right_hand_directions(raw, opaque: bool = False) -> str:
    mapped = []
    for atom in atoms(raw):
        if atom == "MISSING":
            mapped.append("MISSING")
        elif len(atom) >= 2 and atom[-1] in {"a", "b"} and atom[:-1].isdigit():
            mapped.append("inward" if atom[-1] == "a" else "outward")
        else:
            return unresolved(raw, opaque)
    return "+".join(mapped)


def pitch_state(target: str, row: dict) -> dict[str, str]:
    p = row["predictors"]
    fields = ["degree", "range"] if target == "T1" else ["degree", "range", "string", "position"]
    return {field: value(p.get(field)) for field in fields}


def gesture_state(target: str, row: dict, opaque_unresolved: bool = False, drop_gesture_field: str | None = None) -> dict[str, str]:
    dropped = set(drop_gesture_field.split(",")) if drop_gesture_field else set()
    if target == "T1":
        state = {"lh_pitch_motion": value(row.get("target_class"))}
        return {key: item for key, item in state.items() if key not in dropped}
    p = row["predictors"]
    state = {
        "rh_direction": right_hand_directions(p.get("right_finger_raw"), opaque_unresolved),
        "lh_pitch_motion": left_pitch_supercategory(p.get("left_pitch_tech_raw"), opaque_unresolved),
        "lh_timbre": left_timbre_supercategory(p.get("left_timbre_tech_raw"), opaque_unresolved),
    }
    return {key: item for key, item in state.items() if key not in dropped}


def lag_state(state: dict[str, str] | None, fields: list[str]) -> dict[str, str]:
    return {field: state[field] if state is not None else "BOS" for field in fields}


def feature_items(target: str, representation: str, rows: list[dict], opaque_unresolved: bool = False, drop_gesture_field: str | None = None) -> list[tuple[dict[str, str], dict[str, float]]]:
    by_sequence: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_sequence[row["sequence_id"]].append(row)
    result = []
    for sequence_rows in by_sequence.values():
        sequence_rows.sort(key=lambda row: row["event_index"])
        for index, row in enumerate(sequence_rows):
            p, context = row["predictors"], row["context"]
            categorical = {"control.mode": value(context.get("mode")), "control.tuning": value(context.get("tuning")),
                           "control.has_previous": str(index > 0)}
            if target == "T1":
                categorical.update({"control.degree": value(p.get("degree")), "control.range": value(p.get("range"))})
            # T2 same-event symbolic fields are deliberately absent: their
            # compound cardinality mechanically encodes single/multi attack.
            if representation == "R0":
                for lag in (1, 2):
                    categorical[f"atomic.lag{lag}.raw_event_tuple"] = raw_tuple(target, sequence_rows[index - lag]) if index >= lag else "BOS"
            if representation in {"R1", "R3", "R4M", "R4"}:
                pitch_fields = list(pitch_state(target, row))
                for lag in (1, 2):
                    previous_pitch = pitch_state(target, sequence_rows[index - lag]) if index >= lag else None
                    for field, state_value in lag_state(previous_pitch, pitch_fields).items():
                        if representation in {"R1", "R4M", "R4"}:
                            categorical[f"pitch.lag{lag}.{field}"] = state_value
            if representation in {"R2", "R3", "R4M", "R4"}:
                gesture_fields = list(gesture_state(target, row, opaque_unresolved, drop_gesture_field))
                for lag in (1, 2):
                    previous_gesture = gesture_state(target, sequence_rows[index - lag], opaque_unresolved, drop_gesture_field) if index >= lag else None
                    for field, state_value in lag_state(previous_gesture, gesture_fields).items():
                        if representation in {"R2", "R4M", "R4"}:
                            categorical[f"gesture.lag{lag}.{field}"] = state_value
            if representation in {"R3", "R4"}:
                pitch_fields = list(pitch_state(target, row))
                gesture_fields = list(gesture_state(target, row, opaque_unresolved, drop_gesture_field))
                for lag in (1, 2):
                    previous_pitch = pitch_state(target, sequence_rows[index - lag]) if index >= lag else None
                    previous_gesture = gesture_state(target, sequence_rows[index - lag], opaque_unresolved, drop_gesture_field) if index >= lag else None
                    p_state = lag_state(previous_pitch, pitch_fields)
                    g_state = lag_state(previous_gesture, gesture_fields)
                    joint = "|".join([*(f"{key}:{p_state[key]}" for key in pitch_fields), *(f"{key}:{g_state[key]}" for key in gesture_fields)])
                    namespace = "flat_joint" if representation == "R3" else "association"
                    categorical[f"{namespace}.lag{lag}.pitch_x_gesture"] = joint
            result.append((categorical, {"control.position_norm": row["_position_norm"]}))
    # Restore exact input-row order by event id, since grouping above may reorder.
    feature_by_id = {}
    cursor = 0
    for sequence_rows in by_sequence.values():
        for row in sorted(sequence_rows, key=lambda item: item["event_index"]):
            feature_by_id[row["event_id"]] = result[cursor]
            cursor += 1
    return [feature_by_id[row["event_id"]] for row in rows]


def vectorize(train_items, test_items):
    vocabulary = {f"{field}={category}" for categorical, _ in train_items for field, category in categorical.items()}
    fields = {field for categorical, _ in train_items for field in categorical}
    unknown_keys = {f"{field}=UNK" for field in fields}

    def convert(items):
        converted, unknown, total = [], 0, 0
        for categorical, continuous in items:
            record = dict(continuous)
            for field, category in categorical.items():
                key = f"{field}={category}"
                total += 1
                if key not in vocabulary:
                    key = f"{field}=UNK"
                    unknown += 1
                record[key] = 1.0
            converted.append(record)
        return converted, unknown, total

    train_dicts, _, _ = convert(train_items)
    test_dicts, unknown, total = convert(test_items)
    vectorizer = DictVectorizer(sparse=True)
    vectorizer.fit(train_dicts + [{key: 0.0 for key in unknown_keys}])
    return vectorizer.transform(train_dicts), vectorizer.transform(test_dicts), vectorizer, unknown / total if total else 0.0


def aligned_probabilities(model, matrix, labels):
    raw = model.predict_proba(matrix)
    output = np.zeros((matrix.shape[0], len(labels)), dtype=float)
    lookup = {label: index for index, label in enumerate(labels)}
    for source_index, label in enumerate(model.classes_):
        output[:, lookup[label]] = raw[:, source_index]
    return output


def fit_model(matrix, y, c):
    return LogisticRegression(C=c, max_iter=4000, random_state=SEED, solver="lbfgs").fit(matrix, y)


def select_c(rows, items, labels):
    groups = sorted({row["piece_group"] for row in rows})
    scores = {}
    for c in C_GRID:
        fold_losses = []
        for held_out in groups:
            train_indices = [i for i, row in enumerate(rows) if row["piece_group"] != held_out]
            test_indices = [i for i, row in enumerate(rows) if row["piece_group"] == held_out]
            x_train, x_test, _, _ = vectorize([items[i] for i in train_indices], [items[i] for i in test_indices])
            model = fit_model(x_train, [rows[i]["target_class"] for i in train_indices], c)
            probabilities = aligned_probabilities(model, x_test, labels)
            loss, _ = negative_log_likelihood([rows[i]["target_class"] for i in test_indices], probabilities.tolist(), labels)
            fold_losses.append(loss)
        scores[str(c)] = sum(fold_losses) / len(fold_losses)
    return min(C_GRID, key=lambda c: (scores[str(c)], c)), scores


def run(target: str, representation: str, opaque_unresolved: bool = False, exclude_piece: str | None = None, tag: str | None = None, drop_gesture_field: str | None = None, target_sensitivity: str | None = None) -> dict:
    rows = read_rows(target)
    if exclude_piece:
        rows = [row for row in rows if row["piece_group"] != exclude_piece]
    labels = apply_target_sensitivity(target, rows, target_sensitivity)
    add_position_norm(rows)
    items = feature_items(target, representation, rows, opaque_unresolved, drop_gesture_field)
    all_predictions = []
    fold_summaries = []
    for held_out in sorted({row["piece_group"] for row in rows}):
        train_indices = [i for i, row in enumerate(rows) if row["piece_group"] != held_out]
        test_indices = [i for i, row in enumerate(rows) if row["piece_group"] == held_out]
        train_rows = [rows[i] for i in train_indices]
        chosen_c, inner_scores = select_c(train_rows, [items[i] for i in train_indices], labels)
        x_train, x_test, vectorizer, unk_rate = vectorize([items[i] for i in train_indices], [items[i] for i in test_indices])
        model = fit_model(x_train, [rows[i]["target_class"] for i in train_indices], chosen_c)
        probabilities = aligned_probabilities(model, x_test, labels)
        y_true = [rows[i]["target_class"] for i in test_indices]
        y_pred = [labels[index] for index in probabilities.argmax(axis=1)]
        nll, losses = negative_log_likelihood(y_true, probabilities.tolist(), labels)
        balanced, macro_f1, recalls, supports = classification_metrics(y_true, y_pred, labels)
        feature_names = vectorizer.feature_names_
        fold = {"piece_group": held_out, "n": len(test_indices), "selected_C": chosen_c, "inner_piece_macro_nll": inner_scores,
                "nll": nll, "brier": multiclass_brier(y_true, probabilities.tolist(), labels),
                "balanced_accuracy": balanced, "macro_f1": macro_f1, "per_class_recall": recalls,
                "per_class_support": supports, "encoded_feature_columns": len(feature_names),
                "interaction_terms": sum(name.startswith(("flat_joint.", "association.")) for name in feature_names),
                "fitted_coefficients": int(model.coef_.size + model.intercept_.size), "unk_rate": unk_rate}
        if target == "T2":
            positive_index = labels.index("multi_note_attack")
            fold["multi_note_attack_average_precision"] = binary_average_precision(
                [value == "multi_note_attack" for value in y_true], probabilities[:, positive_index].tolist())
        fold_summaries.append(fold)
        for local_index, row_index in enumerate(test_indices):
            all_predictions.append({"event_id": rows[row_index]["event_id"], "piece_group": held_out, "target": y_true[local_index],
                                    "prediction": y_pred[local_index], "probabilities": dict(zip(labels, probabilities[local_index].tolist())),
                                    "loss": losses[local_index]})
    all_predictions.sort(key=lambda row: row["event_id"])
    token_nll = sum(row["loss"] for row in all_predictions) / len(all_predictions)
    piece_nll, per_piece_nll = piece_macro_mean([row["loss"] for row in all_predictions], [row["piece_group"] for row in all_predictions])
    summary = {"target": target, "representation": representation, "n": len(rows), "outer_folds": len(fold_summaries),
               "token_mean_nll": token_nll, "piece_macro_nll": piece_nll, "per_piece_nll": per_piece_nll,
               "folds": fold_summaries, "seed": SEED, "opaque_unresolved": opaque_unresolved,
               "excluded_piece": exclude_piece, "dropped_gesture_field": drop_gesture_field,
               "target_sensitivity": target_sensitivity,
               "status": "exploratory_grouped_cross_validation"}
    output_dir = ROOT / "results" / "baseline_v1"
    output_dir.mkdir(parents=True, exist_ok=True)
    suffix = f"_{tag}" if tag else ""
    (output_dir / f"{target}_{representation}{suffix}_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (output_dir / f"{target}_{representation}{suffix}_predictions.jsonl").open("w", encoding="utf-8") as handle:
        for prediction in all_predictions:
            handle.write(json.dumps(prediction, ensure_ascii=False) + "\n")
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", choices=["T1", "T2"], required=True)
    parser.add_argument("--representation", choices=["R0", "R1", "R2", "R3", "R4M", "R4", "R5"], required=True)
    parser.add_argument("--opaque-unresolved", action="store_true")
    parser.add_argument("--exclude-piece")
    parser.add_argument("--tag")
    parser.add_argument("--drop-gesture-field", help="one field or a comma-separated exploratory drop set")
    parser.add_argument("--target-sensitivity", choices=["merge_returns"])
    args = parser.parse_args()
    print(json.dumps(run(args.target, args.representation, args.opaque_unresolved, args.exclude_piece, args.tag, args.drop_gesture_field, args.target_sensitivity), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
