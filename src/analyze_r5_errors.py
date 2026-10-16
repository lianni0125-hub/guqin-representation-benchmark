"""Aggregate error and counterexample audit for the R5/R2/R4M checkpoint."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

from src.run_baseline_models import ROOT, TARGETS, add_position_norm, read_rows

RESULTS = ROOT / "results" / "baseline_v1"
OUT = ROOT / "results" / "error_analysis_v1"
MODELS = ["R5", "R2", "R4M"]


def load_predictions(target, representation):
    path = RESULTS / f"{target}_{representation}_predictions.jsonl"
    with path.open(encoding="utf-8") as handle:
        return {row["event_id"]: row for row in map(json.loads, handle)}


def mean(values):
    return sum(values) / len(values) if values else None


def position_band(value):
    if value == 0:
        return "BOS_or_zero"
    if value <= 0.25:
        return "Q1"
    if value <= 0.5:
        return "Q2"
    if value <= 0.75:
        return "Q3"
    return "Q4"


def grouped_loss(rows, predictions, key_function):
    groups = defaultdict(list)
    for row in rows:
        groups[str(key_function(row))].append(row)
    output = {}
    for key, members in sorted(groups.items()):
        model_losses = {model: mean([predictions[model][row["event_id"]]["loss"] for row in members]) for model in MODELS}
        output[key] = {
            "n": len(members),
            "mean_nll": model_losses,
            "R2_minus_R5": model_losses["R2"] - model_losses["R5"],
            "R4M_minus_R2": model_losses["R4M"] - model_losses["R2"],
        }
    return output


def calibration(predictions):
    bins = defaultdict(list)
    for prediction in predictions.values():
        confidence = max(prediction["probabilities"].values())
        bin_index = min(int(confidence * 10), 9)
        bins[bin_index].append((confidence, prediction["prediction"] == prediction["target"]))
    output, ece, total = [], 0.0, len(predictions)
    for index in range(10):
        values = bins[index]
        if not values:
            continue
        average_confidence = mean([item[0] for item in values])
        accuracy = mean([float(item[1]) for item in values])
        ece += len(values) / total * abs(average_confidence - accuracy)
        output.append({"bin": index, "n": len(values), "mean_confidence": average_confidence, "accuracy": accuracy})
    return {"ece_10bin_diagnostic": ece, "bins": output}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for target in TARGETS:
        rows = read_rows(target)
        add_position_norm(rows)
        predictions = {model: load_predictions(target, model) for model in MODELS}
        previous_target = {}
        grouped_sequences = defaultdict(list)
        for row in rows:
            grouped_sequences[row["sequence_id"]].append(row)
        for sequence_rows in grouped_sequences.values():
            sequence_rows.sort(key=lambda row: row["event_index"])
            for index, row in enumerate(sequence_rows):
                previous_target[row["event_id"]] = sequence_rows[index - 1]["target_class"] if index else "BOS"

        confusion = {}
        high_confidence_wrong = {}
        calibration_output = {}
        for model in MODELS:
            confusion[model] = dict(Counter(
                f"{prediction['target']} -> {prediction['prediction']}" for prediction in predictions[model].values()
            ))
            high_confidence_wrong[model] = sum(
                prediction["prediction"] != prediction["target"] and max(prediction["probabilities"].values()) >= 0.8
                for prediction in predictions[model].values()
            )
            calibration_output[model] = calibration(predictions[model])

        audit = {
            "target": target,
            "n": len(rows),
            "models": MODELS,
            "by_target_class": grouped_loss(rows, predictions, lambda row: row["target_class"]),
            "by_piece": grouped_loss(rows, predictions, lambda row: row["piece_group"]),
            "by_position_band": grouped_loss(rows, predictions, lambda row: position_band(row["_position_norm"])),
            "by_previous_target_diagnostic": grouped_loss(rows, predictions, lambda row: previous_target[row["event_id"]]),
            "confusion_counts": confusion,
            "high_confidence_wrong_at_0_8": high_confidence_wrong,
            "calibration": calibration_output,
            "interpretation_boundary": "previous-target grouping is descriptive and is not necessarily an input to every model",
        }
        (OUT / f"{target}_error_audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        worst = []
        for row in rows:
            event_id = row["event_id"]
            record = {
                "event_id": event_id,
                "piece_group": row["piece_group"],
                "source": row["source"],
                "target": row["target_class"],
                "previous_target": previous_target[event_id],
                "position_norm": row["_position_norm"],
                "losses": {model: predictions[model][event_id]["loss"] for model in MODELS},
                "predictions": {model: predictions[model][event_id]["prediction"] for model in MODELS},
            }
            record["R2_minus_R5"] = record["losses"]["R2"] - record["losses"]["R5"]
            record["R4M_minus_R2"] = record["losses"]["R4M"] - record["losses"]["R2"]
            worst.append(record)
        worst.sort(key=lambda record: record["losses"]["R2"], reverse=True)
        with (OUT / f"{target}_worst_R2_events.jsonl").open("w", encoding="utf-8") as handle:
            for record in worst[:50]:
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        print(json.dumps({"target": target, "n": len(rows), "status": "PASS"}))


if __name__ == "__main__":
    main()
