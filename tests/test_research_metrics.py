import math
import unittest

from src.research_metrics import (
    binary_average_precision,
    classification_metrics,
    multiclass_brier,
    negative_log_likelihood,
    piece_macro_mean,
    validate_probabilities,
)


class ResearchMetricTests(unittest.TestCase):
    def test_perfect_predictions(self):
        labels = ["a", "b"]
        y_true = ["a", "b"]
        probabilities = [[1.0, 0.0], [0.0, 1.0]]
        nll, losses = negative_log_likelihood(y_true, probabilities, labels)
        self.assertEqual(nll, 0.0)
        self.assertEqual(multiclass_brier(y_true, probabilities, labels), 0.0)
        self.assertEqual(piece_macro_mean(losses, ["p1", "p2"])[0], 0.0)
        balanced_accuracy, macro_f1, recalls, supports = classification_metrics(y_true, y_true, labels)
        self.assertEqual((balanced_accuracy, macro_f1), (1.0, 1.0))
        self.assertEqual(recalls, {"a": 1.0, "b": 1.0})
        self.assertEqual(supports, {"a": 1, "b": 1})

    def test_known_values_and_piece_macro(self):
        labels = ["a", "b"]
        probabilities = [[0.5, 0.5], [0.25, 0.75], [0.5, 0.5]]
        nll, losses = negative_log_likelihood(["a", "b", "b"], probabilities, labels)
        self.assertAlmostEqual(nll, (-math.log(0.5) - math.log(0.75) - math.log(0.5)) / 3)
        macro, per_piece = piece_macro_mean(losses, ["large", "large", "small"])
        self.assertAlmostEqual(macro, (sum(losses[:2]) / 2 + losses[2]) / 2)
        self.assertEqual(set(per_piece), {"large", "small"})

    def test_absent_test_class_is_null_recall_but_zero_macro_f1(self):
        balanced_accuracy, macro_f1, recalls, supports = classification_metrics(
            ["a", "a"], ["a", "a"], ["a", "b"]
        )
        self.assertEqual(balanced_accuracy, 1.0)
        self.assertEqual(macro_f1, 0.5)
        self.assertIsNone(recalls["b"])
        self.assertEqual(supports["b"], 0)

    def test_average_precision(self):
        self.assertAlmostEqual(binary_average_precision([True, False, True], [0.9, 0.8, 0.7]), (1.0 + 2 / 3) / 2)
        self.assertIsNone(binary_average_precision([False], [0.5]))

    def test_probability_validation_rejects_invalid_rows(self):
        with self.assertRaises(ValueError):
            validate_probabilities([[0.2, 0.2]])
        with self.assertRaises(ValueError):
            validate_probabilities([[float("nan"), float("nan")]])


if __name__ == "__main__":
    unittest.main()
