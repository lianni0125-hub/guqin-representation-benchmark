# R4 Robustness and Ablation Report

Date: 2026-10-16  
Status: PASS; CLAIM NARROWED

> Later field-level R2 ablation further localized the T2 effect to prior right-hand direction and produced a smaller exploratory Pareto model. See `docs/r5_error_counterexample_report.md`; the confirmatory R2/R4 results below remain the frozen family-level comparison.

## Association ablation

`R4M` contains separate pitch-tier and gesture-tier main effects but no cross-tier association. It is compared with full R4 using identical primitive inputs.

| Target | R4M piece-macro NLL | R4 full NLL | R4 − R4M Δ [95% interval] | Pieces favouring full R4 |
|---|---:|---:|---:|---:|
| T1 | 0.9508 | 0.9518 | +0.0011 [−0.0115, 0.0150] | 5/10 |
| T2 | 0.2163 | 0.2145 | −0.0019 [−0.0043, 0.0005] | 8/10 |

The explicit association terms are not justified. They slightly hurt T1 on average and give only a very small, uncertain T2 gain while greatly increasing encoded dimensionality. Full H3 therefore does not pass merely because full R4 had the lowest original mean.

## Tier separation versus flat conjunction

| Target | R4M − R3 mean piece Δ | 95% interval | Pieces favouring R4M |
|---|---:|---:|---:|
| T1 | −0.0426 | [−0.0720, −0.0147] | 7/10 |
| T2 | −0.0625 | [−0.1374, 0.0091] | 8/10 |

The T1 result supports separate reusable tier main effects over high-cardinality flat conjunctions. T2 has the same direction but insufficient ten-piece precision. This is evidence about factorization/generalization, not proof of autonomous cognitive tiers.

## Tiered main effects versus economical gesture model

R4M versus R2 is −0.0154 [−0.0417, 0.0098] for T1 and −0.0059 [−0.0199, 0.0065] for T2. Both intervals cross zero while R4M uses substantially more columns. R2 remains the strongest economical representation.

## Frozen sensitivity sets

The confirmatory runs already use documented supercategory mappings and collapse undefined prior codes to `PREV_UNRESOLVED`.

- **Opaque-code sensitivity:** retaining undefined T2 historical codes as uninterpreted categorical strings changes R4−R2 mean piece Δ only from −0.0077 to −0.0079; interval [−0.0250, 0.0068]. No technique meaning is assigned.
- **Highest-missing-piece sensitivity:** `yi` has the highest relevant T2 predictor-missing rate, 2/403 rows (0.50%). Retraining after excluding the entire piece gives R4−R2 Δ −0.0301 [−0.0811, 0.0038], but only 4/9 remaining pieces favour R4. The mean is strongly influenced by `yang`; this does not strengthen an unconditional R4 claim.
- **T1 missing-piece sensitivity:** not applicable because the relevant T1 predictors have no missing rows.

## Piece leverage and reproducibility

For the main R4−R2 comparison, dropping any single piece from the aggregation preserves a negative mean delta: T1 jackknife range −0.0215 to −0.0044; T2 −0.0109 to −0.0014. Thus no single piece reverses the overall direction, although effect size and per-piece signs remain heterogeneous.

Independent reruns of full R4 produced byte-identical prediction files for both targets and semantically identical summaries. Ten Python metric/structure tests and all Node table, release, grouping and leakage tests passed.

## Robustness verdict

1. Gesture history has the most robust fit–economy result.
2. Separate pitch and gesture main effects improve over a flat joint code convincingly for T1 and directionally for T2.
3. Explicit cross-tier association terms are unsupported under the registered cost criterion.
4. Full R4 is not selected over R2; the defensible result is a Pareto set with R2 as the economical working model.
5. Rare-class recognition and ten-piece uncertainty remain material limits.

The result supports a phonological question about feature factorization and representation economy, but it does not license a claim that guqin has been shown to possess language-like autonomous tiers or cognitive underspecification.

