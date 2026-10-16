# R3 Structured Representation Comparison

Date: 2026-10-16  
Status: PRIMARY COMPARISON COMPLETE; ROBUSTNESS WORK REQUIRED

> Subsequent R4M ablation showed that explicit association terms are not justified: tiered main effects alone match or slightly improve full R4 for T1 and nearly match it for T2. The final robustness interpretation is in `docs/r4_robustness_ablation_report.md`; the primary results below are retained as the pre-ablation checkpoint.

## Proper-score comparison

Lower NLL is better. Intervals are deterministic 10,000-draw piece-level bootstrap intervals for mean per-piece delta relative to R5.

### T1: performed left-hand pitch motion

| Representation | Piece-macro NLL | Δ vs R5 [95% interval] | Pieces better than R5 | Median columns | Median UNK |
|---|---:|---:|---:|---:|---:|
| R5 context | 1.0274 | reference | — | 116 | 1.01% |
| R0 atomic | 0.9937 | −0.0337 [−0.0559, −0.0099] | 7/10 | 642 | 6.36% |
| R1 pitch-centred | 0.9958 | −0.0316 [−0.0723, 0.0052] | 8/10 | 323.5 | 1.69% |
| R2 gesture-centred | 0.9662 | −0.0612 [−0.0810, −0.0419] | 10/10 | 132 | 0.72% |
| R3 flat joint | 0.9934 | −0.0340 [−0.0578, −0.0094] | 7/10 | 587.5 | 4.92% |
| R4 multi-tier | 0.9518 | −0.0756 [−0.1188, −0.0350] | 9/10 | 810 | 3.36% |

R4 has the lowest mean NLL, and R4 improves on the information-matched flat R3 by −0.0415 NLL [−0.0683, −0.0153] in 8/10 pieces. However, R4 versus the much smaller R2 is only −0.0143 [−0.0470, 0.0149]; the data do not establish that this extra fit offsets the large complexity increase.

### T2: score right-hand single/multi attack

| Representation | Piece-macro NLL | Δ vs R5 [95% interval] | Pieces better than R5 | Median columns | Median UNK |
|---|---:|---:|---:|---:|---:|
| R5 context | 0.2890 | reference | — | 13 | 0.00% |
| R0 atomic | 0.2853 | −0.0037 [−0.0195, 0.0134] | 6/10 | 1,164 | 25.24% |
| R1 pitch-centred | 0.2343 | −0.0546 [−0.0951, −0.0175] | 9/10 | 577 | 3.87% |
| R2 gesture-centred | 0.2222 | −0.0668 [−0.1249, −0.0127] | 9/10 | 106 | 0.14% |
| R3 flat joint | 0.2788 | −0.0102 [−0.0390, 0.0113] | 5/10 | 1,031 | 23.49% |
| R4 multi-tier | 0.2145 | −0.0745 [−0.1323, −0.0256] | 8/10 | 1,684.5 | 9.08% |

R4 again has the lowest mean NLL, but its advantage over R2 is only −0.0077 [−0.0238, 0.0061]. R4 versus flat R3 is −0.0643, but its interval [−0.1366, 0.0066] crosses zero. R2 is therefore the strongest economical model at this checkpoint.

## Fit–coverage–cost result

The empirical Pareto frontier is the same for both targets: **R5 → R2 → R4**.

- R5 supplies the minimum-complexity context reference.
- R2 gives a large, cross-piece improvement at very small additional cost and very low UNK exposure.
- R4 gives the lowest aggregate NLL but at much greater dimensional cost; its advantage over R2 is not stable enough yet to select it unconditionally.
- R0, R1 and R3 are dominated on the registered NLL/encoded-column plane.

This pattern supports a constrained conclusion: preceding gesture organization carries robust predictive structure beyond physical/context controls; a multi-tier organization generalizes better than an information-matched flat conjunction for T1, but the present data do not yet show that R4 is preferable to the economical gesture-centred R2 after cost is considered.

## Classification limits

Proper probability score, not winning-label accuracy, is primary. The imbalance remains consequential:

- T1 R4 pooled recall is 0.923 for stationary press, 0.037 for continuous oscillation, 0.445 for upward motion, 0.275 for downward motion, and 0 for both return classes.
- T2 R4 multi-note recall is 0.210 and average precision is 0.554; R2 gives recall 0.198 and average precision 0.503.

The models therefore learn probability structure but do not solve rare-class recognition. No phonological category-identification claim may be based solely on the aggregate NLL improvement.

## Integrity and remaining work

- R3 and R4 use exactly the same primitive pitch and gesture information.
- All vocabulary fitting and C selection occur inside the relevant training folds.
- Current T2 compound fields are excluded; only preceding-event values enter sequential representations.
- Undefined source codes remain `PREV_UNRESOLVED` rather than receiving invented technique labels.
- Next work must run ablations and frozen sensitivity sets, audit piece leverage and missingness, and assess whether R4's extra association terms are justified beyond separate tiers.

