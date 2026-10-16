# R2 Frozen Baseline Report

Date: 2026-10-16  
Status: PASS WITH RECORDED T2 SPECIFICATION CORRECTION

## Valid baseline results

| Target | Representation | Token mean NLL | Piece-macro NLL | Pieces better than R5 | Encoded columns by fold | UNK rate by fold |
|---|---:|---:|---:|---:|---:|---:|
| T1 performed LH motion | R5 | 0.9850 | 1.0274 | reference | 94–118 | 0.4%–20.0% |
| T1 performed LH motion | R0 | 0.9549 | 0.9937 | 7/10 | 534–672 | 1.7%–19.2% |
| T2 score RH attack | R5 corrected | 0.2867 | 0.2890 | reference | 13 | 0% |
| T2 score RH attack | R0 schema v1.1 | 0.2747 | 0.2853 | 6/10 | 929–1,217 | 8.6%–46.7% |

Negative delta NLL favours R0. Relative to R5, R0 changes token/piece-macro NLL by −0.0301/−0.0337 for T1 and −0.0120/−0.0037 for T2. The T2 figures were rerun under analysis-table schema v1.1 after the preregistered historical `R finger` field was restored (research-log event E24). These are baseline observations, not final answers to the research questions.

## Required correction before valid T2 results

The first T2 R5 run was invalid. Current-event `string` alone had 62 categories that were each target-pure and together separated all 1,712 eligible events. Compound current degree, position and left-hand fields carried the same-event multiplicity as well. This is definitional proxy leakage under the pre-existing prohibition, not a representational result.

The valid corrected T2 shared controls are mode, tuning, normalized within-section position and BOS/previous-event availability. Historical event tuples remain allowed because they describe preceding rather than current events. The invalid generated summary was overwritten; the discovery and correction remain permanently recorded in research-log event E22.

## Verification

- five synthetic Python metric tests passed;
- canonical-table, release, input-freeze and seven representation/leakage tests passed;
- all four valid runs contain 10 outer folds and the expected 2,303/1,712 predictions;
- every probability vector is finite and sums to one;
- all vocabulary fitting and hyperparameter selection occur inside the relevant training folds;
- no convergence warning was observed.

## Interpretation boundary

R0 modestly improves aggregate proper scores over R5, but the direction is not uniform across held-out pieces and R0 has high state complexity and, especially for T2, substantial UNK exposure. It therefore establishes a useful baseline without deciding whether pitch-centred, gesture-centred or multi-tier structure is preferable. That comparison belongs to R3.

