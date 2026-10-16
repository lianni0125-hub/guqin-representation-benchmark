import json
import unittest
from pathlib import Path

from src.run_baseline_models import (
    add_position_norm,
    apply_target_sensitivity,
    feature_items,
    left_pitch_supercategory,
    left_timbre_supercategory,
    right_hand_directions,
)


ROOT = Path(__file__).resolve().parents[1]


def t2_rows():
    """Use restricted local rows when present, otherwise the public synthetic fixture."""
    restricted = ROOT / "data" / "interim" / "gq39_analysis_v1" / "t2_score_rh_attack_eligible.jsonl"
    fixture = ROOT / "fixtures" / "synthetic_t2_events.jsonl"
    path = restricted if restricted.exists() else fixture
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


class StructuredRepresentationTests(unittest.TestCase):
    def test_post_primary_return_merge_changes_only_return_labels(self):
        rows = [{"target_class": label} for label in ["up_return", "down_return", "upward_motion"]]
        labels = apply_target_sensitivity("T1", rows, "merge_returns")
        self.assertEqual([row["target_class"] for row in rows], ["return_motion", "return_motion", "upward_motion"])
        self.assertEqual(labels[-1], "return_motion")

    def test_documented_gesture_mappings_and_unresolved_values(self):
        self.assertEqual(left_pitch_supercategory("3a,4b"), "upward_motion+downward_motion")
        self.assertEqual(left_pitch_supercategory("7b"), "PREV_UNRESOLVED")
        self.assertEqual(left_timbre_supercategory("1,3"), "harmonic+ordinary_stopped")
        self.assertEqual(left_timbre_supercategory("0,3"), "PREV_UNRESOLVED")
        self.assertEqual(right_hand_directions("3a,2b"), "inward+outward")
        self.assertEqual(right_hand_directions("0"), "PREV_UNRESOLVED")
        self.assertEqual(right_hand_directions("0", opaque=True), "OPAQUE:0")

    def test_r3_r4_have_identical_joint_primitive_values(self):
        rows = t2_rows()[:20]
        add_position_norm(rows)
        r3 = feature_items("T2", "R3", rows)
        r4 = feature_items("T2", "R4", rows)
        for (flat, _), (tiered, _) in zip(r3, r4):
            r3_values = sorted(value for key, value in flat.items() if key.startswith("flat_joint."))
            r4_values = sorted(value for key, value in tiered.items() if key.startswith("association."))
            self.assertEqual(r3_values, r4_values)

    def test_r4m_has_tier_main_effects_but_no_association(self):
        rows = t2_rows()[:20]
        add_position_norm(rows)
        for categorical, _ in feature_items("T2", "R4M", rows):
            self.assertTrue(any(key.startswith("pitch.") for key in categorical))
            self.assertTrue(any(key.startswith("gesture.") for key in categorical))
            self.assertFalse(any(key.startswith("association.") for key in categorical))

    def test_drop_one_gesture_field_removes_only_that_primitive(self):
        rows = t2_rows()[:20]
        add_position_norm(rows)
        categorical, _ = feature_items("T2", "R2", rows, drop_gesture_field="rh_direction")[2]
        self.assertFalse(any("rh_direction" in key for key in categorical))
        self.assertTrue(any("lh_pitch_motion" in key for key in categorical))
        self.assertTrue(any("lh_timbre" in key for key in categorical))

    def test_no_current_t2_symbolic_field_enters_controls(self):
        rows = t2_rows()[:20]
        add_position_norm(rows)
        for representation in ["R0", "R1", "R2", "R3", "R4", "R5"]:
            for categorical, _ in feature_items("T2", representation, rows):
                self.assertFalse(any(key.startswith("control.string") or key.startswith("control.position") or key.startswith("control.lh") for key in categorical))

    def test_future_mutation_does_not_change_current_features(self):
        rows = t2_rows()[:3]
        add_position_norm(rows)
        before = {rep: feature_items("T2", rep, rows)[1] for rep in ["R1", "R2", "R3", "R4"]}
        rows[2]["predictors"]["degree"] = "FUTURE_SECRET"
        rows[2]["predictors"]["right_finger_raw"] = "9a"
        after = {rep: feature_items("T2", rep, rows)[1] for rep in ["R1", "R2", "R3", "R4"]}
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
