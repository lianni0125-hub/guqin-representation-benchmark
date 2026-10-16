"""Summarize registered T2 gesture-field drop diagnostics."""

from __future__ import annotations

import json
import statistics

import numpy as np

from src.run_baseline_models import ROOT, SEED

RESULTS = ROOT / "results" / "baseline_v1"


def load(name):
    return json.loads((RESULTS / f"{name}_summary.json").read_text(encoding="utf-8"))


def compare(left_name, right_name, rng):
    left, right = load(left_name), load(right_name)
    pieces = sorted(left["per_piece_nll"])
    values = np.asarray([left["per_piece_nll"][piece] - right["per_piece_nll"][piece] for piece in pieces])
    bootstrap = rng.choice(values, size=(10000, len(values)), replace=True).mean(axis=1)
    return {
        "mean_piece_delta_nll": float(values.mean()),
        "piece_bootstrap_95_interval": [float(value) for value in np.quantile(bootstrap, [0.025, 0.975])],
        "pieces_favouring_left": int(sum(values < 0)),
    }


def main():
    rng = np.random.default_rng(SEED)
    variants = {
        "full_R2": "T2_R2",
        "drop_rh_direction": "T2_R2_drop_rh_direction",
        "drop_lh_pitch_motion": "T2_R2_drop_lh_pitch_motion",
        "drop_lh_timbre": "T2_R2_drop_lh_timbre",
        "rh_direction_only_exploratory": "T2_R2_rh_direction_only",
    }
    output = {"seed": SEED, "bootstrap_draws": 10000, "variants": {}, "comparisons": {}}
    for label, name in variants.items():
        summary = load(name)
        output["variants"][label] = {
            "token_mean_nll": summary["token_mean_nll"],
            "piece_macro_nll": summary["piece_macro_nll"],
            "median_encoded_columns": statistics.median(fold["encoded_feature_columns"] for fold in summary["folds"]),
            "median_unk_rate": statistics.median(fold["unk_rate"] for fold in summary["folds"]),
        }
    output["comparisons"]["drop_rh_minus_full"] = compare(variants["drop_rh_direction"], variants["full_R2"], rng)
    output["comparisons"]["drop_lh_pitch_minus_full"] = compare(variants["drop_lh_pitch_motion"], variants["full_R2"], rng)
    output["comparisons"]["drop_lh_timbre_minus_full"] = compare(variants["drop_lh_timbre"], variants["full_R2"], rng)
    output["comparisons"]["rh_only_minus_R5"] = compare(variants["rh_direction_only_exploratory"], "T2_R5", rng)
    output["comparisons"]["drop_lh_timbre_minus_rh_only"] = compare(variants["drop_lh_timbre"], variants["rh_direction_only_exploratory"], rng)
    (RESULTS / "r5_feature_ablations.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
