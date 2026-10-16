# T1 Post-primary Return-merge Sensitivity

Date: 2026-10-16  
Role: outcome-informed post-primary sensitivity; the frozen six-way analysis remains primary

## Frozen change

Only `up_return` and `down_return` were merged into `return_motion`. The other four T1 classes, data rows, grouped folds, model families, hyperparameter grid, seed and metrics were unchanged. The mapping and stop rule were frozen before inspecting these outcomes.

## Results

| Representation | Token NLL | Piece-macro NLL | Return support | Return recall | Return mean NLL |
|---|---:|---:|---:|---:|---:|
| R5 | 0.9520 | 0.9904 | 107 | 3.74% | 2.6750 |
| R2 | 0.8895 | 0.9281 | 107 | 2.80% | 2.6843 |
| R4M | 0.8768 | 0.9131 | 107 | 0.93% | 2.7771 |

R2 still improves aggregate piece-macro NLL over R5 by −0.0622 [−0.0819, −0.0419] in 9/10 pieces. R4M versus R2 is −0.0151 [−0.0399, 0.0103]. These reproduce the broad representation-family pattern but do not resolve the merged return class.

## Interpretation

Directional sparsity within the return pair is not the main explanation for failure. Even after support rises from 53/54 separate cases to 107 merged cases, the models almost never select `return_motion`, and its proper-score loss does not improve under gesture history. Current permitted context is insufficient to recover return motion as a class.

The author-documented six-way categories remain valid descriptive source mappings, but the study does not establish up-return, down-return or their merged return family as reliably predictable structural contrasts. No further target merge is permitted in Paper 1 under the frozen stop rule.

