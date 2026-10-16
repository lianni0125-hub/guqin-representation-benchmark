"""Frozen evaluation metrics for the Guqin representation study.

Only the Python standard library is used here so the metric contract can be
tested before installing or running the estimator.
"""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Iterable, Sequence


def validate_probabilities(probabilities: Sequence[Sequence[float]], tolerance: float = 1e-9) -> None:
    if not probabilities:
        raise ValueError("probabilities must not be empty")
    width = len(probabilities[0])
    if width < 2:
        raise ValueError("at least two classes are required")
    for row in probabilities:
        if len(row) != width:
            raise ValueError("probability rows have unequal widths")
        if any((not math.isfinite(value)) or value < 0.0 or value > 1.0 for value in row):
            raise ValueError("probabilities must be finite and in [0, 1]")
        if not math.isclose(sum(row), 1.0, rel_tol=0.0, abs_tol=tolerance):
            raise ValueError("each probability row must sum to one")


def negative_log_likelihood(
    y_true: Sequence[str], probabilities: Sequence[Sequence[float]], labels: Sequence[str], epsilon: float = 1e-15
) -> tuple[float, list[float]]:
    validate_probabilities(probabilities)
    if len(y_true) != len(probabilities):
        raise ValueError("target and probability lengths differ")
    label_index = {label: index for index, label in enumerate(labels)}
    if len(label_index) != len(labels):
        raise ValueError("labels must be unique")
    losses = []
    for target, row in zip(y_true, probabilities):
        if target not in label_index:
            raise ValueError(f"unknown target label: {target}")
        losses.append(-math.log(max(row[label_index[target]], epsilon)))
    return sum(losses) / len(losses), losses


def piece_macro_mean(losses: Sequence[float], piece_groups: Sequence[str]) -> tuple[float, dict[str, float]]:
    if len(losses) != len(piece_groups) or not losses:
        raise ValueError("losses and piece groups must have equal non-zero length")
    grouped: dict[str, list[float]] = defaultdict(list)
    for loss, group in zip(losses, piece_groups):
        grouped[group].append(loss)
    per_piece = {group: sum(values) / len(values) for group, values in sorted(grouped.items())}
    return sum(per_piece.values()) / len(per_piece), per_piece


def multiclass_brier(y_true: Sequence[str], probabilities: Sequence[Sequence[float]], labels: Sequence[str]) -> float:
    validate_probabilities(probabilities)
    if len(y_true) != len(probabilities):
        raise ValueError("target and probability lengths differ")
    label_index = {label: index for index, label in enumerate(labels)}
    total = 0.0
    for target, row in zip(y_true, probabilities):
        target_index = label_index[target]
        total += sum((value - (1.0 if index == target_index else 0.0)) ** 2 for index, value in enumerate(row))
    return total / len(y_true)


def classification_metrics(
    y_true: Sequence[str], y_pred: Sequence[str], labels: Sequence[str]
) -> tuple[float, float, dict[str, float | None], dict[str, int]]:
    if len(y_true) != len(y_pred) or not y_true:
        raise ValueError("targets and predictions must have equal non-zero length")
    recalls: dict[str, float | None] = {}
    supports: dict[str, int] = {}
    f1_values: list[float] = []
    for label in labels:
        tp = sum(actual == label and predicted == label for actual, predicted in zip(y_true, y_pred))
        fn = sum(actual == label and predicted != label for actual, predicted in zip(y_true, y_pred))
        fp = sum(actual != label and predicted == label for actual, predicted in zip(y_true, y_pred))
        support = tp + fn
        supports[label] = support
        recalls[label] = tp / support if support else None
        denominator = (2 * tp) + fp + fn
        f1_values.append((2 * tp) / denominator if denominator else 0.0)
    supported_recalls = [value for value in recalls.values() if value is not None]
    balanced_accuracy = sum(supported_recalls) / len(supported_recalls)
    macro_f1 = sum(f1_values) / len(labels)
    return balanced_accuracy, macro_f1, recalls, supports


def binary_average_precision(y_true_positive: Iterable[bool], positive_scores: Iterable[float]) -> float | None:
    pairs = sorted(zip(positive_scores, y_true_positive), key=lambda pair: pair[0], reverse=True)
    positives = sum(is_positive for _, is_positive in pairs)
    if positives == 0:
        return None
    true_positives = 0
    precision_sum = 0.0
    for rank, (_, is_positive) in enumerate(pairs, start=1):
        if is_positive:
            true_positives += 1
            precision_sum += true_positives / rank
    return precision_sum / positives

