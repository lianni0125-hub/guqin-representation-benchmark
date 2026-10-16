"""Summarize frozen ablation, sensitivity, leverage and reproducibility checks."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from src.run_baseline_models import ROOT, SEED

RESULTS = ROOT / "results" / "baseline_v1"


def load(name):
    return json.loads((RESULTS / f"{name}_summary.json").read_text(encoding="utf-8"))


def compare(left_name, right_name, rng):
    left, right = load(left_name), load(right_name)
    pieces = sorted(set(left["per_piece_nll"]) & set(right["per_piece_nll"]))
    deltas = np.asarray([left["per_piece_nll"][piece] - right["per_piece_nll"][piece] for piece in pieces])
    bootstrap = rng.choice(deltas, size=(10000, len(deltas)), replace=True).mean(axis=1)
    jackknife = {
        dropped: float(np.mean([delta for piece, delta in zip(pieces, deltas) if piece != dropped]))
        for dropped in pieces
    }
    return {
        "left_minus_right_mean_piece_nll": float(deltas.mean()),
        "piece_bootstrap_95_interval": [float(value) for value in np.quantile(bootstrap, [0.025, 0.975])],
        "pieces_favouring_left": int(sum(deltas < 0)),
        "pieces_compared": len(pieces),
        "per_piece_delta": dict(zip(pieces, map(float, deltas))),
        "leave_one_piece_out_mean_delta": jackknife,
        "jackknife_range": [min(jackknife.values()), max(jackknife.values())],
    }


def main():
    rng = np.random.default_rng(SEED)
    output = {"seed": SEED, "bootstrap_draws": 10000, "ablation": {}, "sensitivity": {}, "reproducibility": {}}
    for target in ["T1", "T2"]:
        output["ablation"][target] = {
            "association_R4_minus_R4M": compare(f"{target}_R4", f"{target}_R4M", rng),
            "tiered_main_R4M_minus_flat_R3": compare(f"{target}_R4M", f"{target}_R3", rng),
            "tiered_main_R4M_minus_gesture_R2": compare(f"{target}_R4M", f"{target}_R2", rng),
        }
    output["sensitivity"]["T2_opaque_raw"] = compare("T2_R4_opaque", "T2_R2_opaque", rng)
    output["sensitivity"]["T2_exclude_highest_missing_piece_yi"] = compare("T2_R4_exclude_yi", "T2_R2_exclude_yi", rng)
    output["sensitivity"]["T1_missing_piece_exclusion"] = "not applicable: no predictor-missing rows"
    for target in ["T1", "T2"]:
        main_summary = load(f"{target}_R4")
        repeated_summary = load(f"{target}_R4_reproduce")
        for key in ["opaque_unresolved", "excluded_piece"]:
            main_summary[key] = repeated_summary[key]
        output["reproducibility"][target] = {
            "semantic_summary_equal": main_summary == repeated_summary,
            "predictions_byte_equal": (RESULTS / f"{target}_R4_predictions.jsonl").read_bytes()
            == (RESULTS / f"{target}_R4_reproduce_predictions.jsonl").read_bytes(),
        }
    (RESULTS / "r4_robustness.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
