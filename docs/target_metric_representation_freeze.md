# Target, metric and representation-input freeze v0.1

Status: **frozen for researcher review before Research stage**  
Freeze date: 2026-10-16  
Outcome status at freeze: field frequencies and duplicates inspected; no representation-model outcomes computed

The normative machine-readable specification is `experiments/experiment_registry_v0_1.json`. Any later change requires a dated amendment stating which outcomes had already been inspected.

## 1. Primary target

`T1_performed_lh_pitch_motion_6way` predicts the broad performed left-hand pitch-motion class of each GQ39 performance event:

| Class | Source codes | Count |
|---|---|---:|
| stationary press | `1` | 1,484 |
| continuous oscillation | `2` | 109 |
| upward motion | `3`, `3a`, `3b`, `3c`, `3a,3b` | 436 |
| downward motion | `4`, `4a`, `4b` | 167 |
| up-and-return | `5`, `5a` | 54 |
| down-and-return | `6`, `6a` | 53 |

All 2,303 declared performed notes enter this broad-class target. The collapse is licensed by the workbook's own hierarchy: the number supplies the movement supercategory and the letter supplies a subtype. `吟` and `猱` remain one continuous-oscillation class.

Current acoustic `pitch`, `contour`, and `duration` are prohibited predictors because the performed-technique labels may have been annotated using the same acoustic trajectory. This prevents circularly predicting an annotation from the evidence used to assign it.

## 2. Secondary target

`T2_score_rh_attack_binary` predicts documented score-side right-hand attack type:

| Class | Source code | Count |
|---|---|---:|
| single-note attack | `1` | 1,545 |
| broad multi-note attack | `2` | 167 |

There are 1,712 eligible events. Codes `0`, `3a`, and missing values are excluded from target loss and reported by piece. Current right-finger multiplicity is prohibited because multiple simultaneous finger values would mechanically reveal a multi-note target.

The target is intentionally called broad multi-note attack, not `撮`, `潑`, or `剌`: GQ39 combines those possibilities.

## 3. Information boundary

Every representation receives the same R5 control block. Candidate representations may add only predeclared information:

- R0: previous event as an unanalyzed raw tuple;
- R1: factored pitch/degree/range history;
- R2: factored documented gesture history;
- R3: a flat joint encoding of pitch and gesture primitives;
- R4: the same primitives on separate tiers with predeclared lag-aligned associations;
- R5: context/physical controls only.

R3 and R4 receive exactly the same primitive information. Their difference is architecture, not access to extra columns. Sequential features use previous events only. Current non-target physical controls are target-specific and listed in the registry.

The copied score templates inside performance workbooks never count as independent examples. No vocabulary, normalization statistic or rare-value decision may use the held-out piece.

## 4. Missing and unresolved values

- Target values must be author-documented and map to exactly one registered class.
- Unsupported target codes are excluded from loss, never relabelled as absence.
- Missing predictors receive explicit typed indicators; they are not filled from another dataset.
- A previous unresolved code becomes `PREV_UNRESOLVED`.
- A value unseen in the training fold becomes `UNK`, even if it occurs elsewhere in the corpus.
- Primary results use the documented-only set; opaque raw predictors enter only a registered sensitivity analysis.

## 5. Estimation and metrics

The common estimator is a regularized multinomial logistic model with categorical one-hot features and only predeclared interactions. Regularization is chosen inside each outer training set from `C = {0.01, 0.1, 1, 10}` using grouped mean negative log-likelihood.

Primary metric: held-out token-mean negative log-likelihood in natural-log units. This proper scoring rule evaluates probability quality rather than only the winning label.

Required accompanying results:

- piece-macro mean NLL;
- multiclass Brier score;
- balanced accuracy and macro-F1;
- per-class recall;
- per-piece NLL difference from R5;
- average precision for the minority multi-note class in T2.

Because observations within a piece are dependent, uncertainty is summarized over the ten held-out-piece results, with a piece-level bootstrap interval. Token-level independence tests are prohibited.

## 6. Economy decision

No post-hoc scalar complexity weight will select a winner. Each representation is reported on a fit–complexity Pareto display using:

- primitive inputs;
- encoded columns and interaction terms;
- fitted coefficients;
- atomic inventory size where applicable;
- held-out `UNK` rate;
- predictive NLL.

A representation is supported only if its improvement recurs across held-out pieces and is not explained solely by additional information or parameters. R4 does not win merely by being richer; it must justify separation and associations relative to R3.

## 7. Interpretation boundary

The experiment can establish task-relative candidate structural contrasts, contextual recoverability and representational economy. It cannot establish phonemes, allophones, psychological storage or identity between language and music.

If R5, R0 or R1 wins, that is evidence limiting the need for a special gesture/multi-tier analysis. If no ranking is stable, the registered conclusion is indeterminate or H-revise—not a post-hoc target change.

## 8. Freeze decision

The targets, grouping, primary metric, missingness rules and R0–R5 information boundaries are now specified before model outcomes. Entry into the Research stage still requires researcher approval of the conceptual framework and completion or explicit scoping of the outstanding literature/licence blockers.
