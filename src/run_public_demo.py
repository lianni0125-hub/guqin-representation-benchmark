"""Run the real R2 encoder/model path on the fictional public fixture."""
import json
from pathlib import Path
from src.research_metrics import negative_log_likelihood
from src.run_baseline_models import add_position_norm, aligned_probabilities, feature_items, fit_model, vectorize
ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "fixtures" / "synthetic_t2_events.jsonl"
LABELS = ["single_note_attack", "multi_note_attack"]
def main():
    rows = [json.loads(line) for line in FIXTURE.read_text(encoding="utf-8").splitlines() if line.strip()]
    add_position_norm(rows); items = feature_items("T2", "R2", rows); folds = []
    for held_out in sorted({row["piece_group"] for row in rows}):
        train = [i for i, row in enumerate(rows) if row["piece_group"] != held_out]; test = [i for i, row in enumerate(rows) if row["piece_group"] == held_out]
        x_train, x_test, vectorizer, unknown_rate = vectorize([items[i] for i in train], [items[i] for i in test])
        model = fit_model(x_train, [rows[i]["target_class"] for i in train], 1.0)
        probabilities = aligned_probabilities(model, x_test, LABELS)
        nll, _ = negative_log_likelihood([rows[i]["target_class"] for i in test], probabilities.tolist(), LABELS)
        if not all(abs(sum(row) - 1.0) < 1e-9 for row in probabilities): raise RuntimeError("invalid probabilities")
        folds.append({"held_out_piece": held_out, "n": len(test), "nll": nll, "encoded_columns": len(vectorizer.feature_names_), "unknown_rate": unknown_rate})
    print(json.dumps({"status": "PASS", "fixture_only": True, "representation": "R2", "rows": len(rows), "outer_folds": len(folds), "folds": folds}, indent=2))
if __name__ == "__main__": main()
