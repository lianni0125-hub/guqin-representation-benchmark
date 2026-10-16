"""Create the deterministic R3 fit-coverage-cost comparison artifact."""

from __future__ import annotations

import json
import statistics
from pathlib import Path

import numpy as np

from src.research_metrics import binary_average_precision, classification_metrics, multiclass_brier
from src.run_baseline_models import ROOT, SEED, TARGETS

REPS = ["R5", "R0", "R1", "R2", "R3", "R4"]


def bootstrap_mean_interval(values, rng, draws=10000):
    array = np.asarray(values, dtype=float)
    samples = rng.choice(array, size=(draws, len(array)), replace=True).mean(axis=1)
    return [float(x) for x in np.quantile(samples, [0.025, 0.975])]


def load(target, representation):
    directory = ROOT / "results" / "baseline_v1"
    summary = json.loads((directory / f"{target}_{representation}_summary.json").read_text(encoding="utf-8"))
    with (directory / f"{target}_{representation}_predictions.jsonl").open(encoding="utf-8") as handle:
        predictions = [json.loads(line) for line in handle]
    return summary, predictions


def pareto_front(rows):
    result = []
    for candidate in rows:
        dominated = any(
            other["piece_macro_nll"] <= candidate["piece_macro_nll"]
            and other["median_encoded_columns"] <= candidate["median_encoded_columns"]
            and (other["piece_macro_nll"] < candidate["piece_macro_nll"]
                 or other["median_encoded_columns"] < candidate["median_encoded_columns"])
            for other in rows if other is not candidate
        )
        if not dominated:
            result.append(candidate["representation"])
    return result


def main():
    rng = np.random.default_rng(SEED)
    output = {"seed": SEED, "piece_bootstrap_draws": 10000, "targets": {}}
    for target in TARGETS:
        loaded = {representation: load(target, representation) for representation in REPS}
        r5 = loaded["R5"][0]
        rows = []
        for representation in REPS:
            summary, predictions = loaded[representation]
            labels = TARGETS[target]["labels"]
            probabilities = [[row["probabilities"][label] for label in labels] for row in predictions]
            y_true = [row["target"] for row in predictions]
            y_pred = [row["prediction"] for row in predictions]
            balanced, macro_f1, recalls, supports = classification_metrics(y_true, y_pred, labels)
            deltas = [summary["per_piece_nll"][piece] - r5["per_piece_nll"][piece] for piece in sorted(r5["per_piece_nll"])]
            record = {
                "representation": representation,
                "token_mean_nll": summary["token_mean_nll"],
                "piece_macro_nll": summary["piece_macro_nll"],
                "delta_piece_nll_vs_R5": statistics.mean(deltas),
                "delta_vs_R5_piece_bootstrap_95_interval": bootstrap_mean_interval(deltas, rng),
                "pieces_better_than_R5": sum(delta < 0 for delta in deltas),
                "pooled_multiclass_brier": multiclass_brier(y_true, probabilities, labels),
                "pooled_balanced_accuracy": balanced,
                "pooled_macro_f1": macro_f1,
                "pooled_per_class_recall": recalls,
                "pooled_per_class_support": supports,
                "median_encoded_columns": statistics.median(fold["encoded_feature_columns"] for fold in summary["folds"]),
                "median_fitted_coefficients": statistics.median(fold.get("fitted_coefficients", 0) for fold in summary["folds"]),
                "median_unk_rate": statistics.median(fold["unk_rate"] for fold in summary["folds"]),
            }
            if target == "T2":
                positive = labels.index("multi_note_attack")
                record["pooled_multi_note_average_precision"] = binary_average_precision(
                    [label == "multi_note_attack" for label in y_true], [row[positive] for row in probabilities]
                )
            rows.append(record)
        pairwise = {}
        for left, right in [("R2", "R1"), ("R4", "R2"), ("R4", "R3")]:
            left_summary, right_summary = loaded[left][0], loaded[right][0]
            deltas = [left_summary["per_piece_nll"][piece] - right_summary["per_piece_nll"][piece]
                      for piece in sorted(left_summary["per_piece_nll"])]
            pairwise[f"{left}_minus_{right}"] = {
                "mean_piece_delta_nll": statistics.mean(deltas),
                "piece_bootstrap_95_interval": bootstrap_mean_interval(deltas, rng),
                "pieces_favouring_left": sum(delta < 0 for delta in deltas),
            }
        output["targets"][target] = {"representations": rows, "pareto_front": pareto_front(rows), "pairwise": pairwise}
    directory = ROOT / "results" / "baseline_v1"
    (directory / "r3_comparison.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
