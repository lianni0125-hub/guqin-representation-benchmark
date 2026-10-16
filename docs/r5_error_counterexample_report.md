# R5 Error and Counterexample Report

Date: 2026-10-16  
Status: COMPLETE FOR CURRENT TARGETS

## T1 performed left-hand motion

R2 gesture history improves mean NLL over R5 for continuous oscillation (−0.155), downward motion (−0.370), upward motion (−0.046) and stationary press (−0.032). It worsens up-return (+0.121) and down-return (+0.057). R4M adds its clearest gains for downward (−0.149 versus R2) and upward motion (−0.049), but also worsens both return classes.

The 50 highest-loss R2 events contain 25 down-return, 11 continuous-oscillation and 9 up-return events. This is not simply the majority-class pattern. The model fails particularly on low-frequency return contrasts: both return classes have zero winning-label recall under R4M/full R4, even though their probability losses remain measurable.

The authorized post-primary sensitivity merged both return directions into one 107-event `return_motion` class. Recall remained only 2.80% under R2 and 0.93% under R4M, and return-class NLL did not improve over R5. The failure is therefore not explained solely by dividing return direction too finely; the licensed predictors do not recover return motion reliably.

R2 improves over R5 in every held-out piece, but the size varies. Its benefit is smallest for `ciou` and largest for `siang`/`gu`. Gains are concentrated away from sequence beginnings; BOS/zero-position events receive no robust history advantage, as expected.

**Counterexample implication:** previous gesture history is useful as a group, but the six current-motion distinctions are not thereby all validated as independently recoverable contrasts. Return categories require either more observations, different contextual features, or a revised target/merge analysis.

## T2 right-hand single/multi attack

R2 improves mean NLL far more for the minority multi-note class (−0.423 versus R5) than for single-note attacks (−0.014). High-confidence wrong predictions fall from 135 under R5 to 88 under R2 and 81 under R4M. The worst 50 R2 events are all multi-note attacks; 43 follow a single-note attack, identifying single→multi transitions as the main counterexample environment.

Piece heterogeneity remains substantial. R2 is worse than R5 for `jiou` but strongly better for `yang` and `yu`. R4M reduces T2 loss most in later normalized position bands, but its advantage over R2 is not uniform across pieces.

## Gesture-field necessity for T2

Drop-one-field results use the same grouped nested evaluation:

| T2 gesture representation | Piece-macro NLL | Median columns | Drop-minus-full R2 Δ [95% interval] |
|---|---:|---:|---:|
| full R2 | 0.2222 | 106 | reference |
| without prior RH direction | 0.2509 | 88 | +0.0287 [+0.0097, +0.0516] |
| without prior LH pitch motion | 0.2180 | 69 | −0.0042 [−0.0106, +0.0013] |
| without prior LH timbre | 0.2008 | 69 | −0.0214 [−0.0425, −0.0024] |
| RH direction only, second-stage exploratory | 0.2075 | 31 | −0.0815 versus R5 [−0.1426, −0.0288] |

Prior right-hand direction is independently necessary for the registered T2 prediction. Prior left-hand pitch motion is not demonstrably necessary, and including prior left-hand timbre hurts held-out fit in this estimator. The outcome-informed “RH direction only” diagnostic shows that a minimal 31-column representation retains a large advantage over R5; the 69-column RH-direction-plus-LH-pitch variant has the lowest mean, but its advantage over RH-direction-only is uncertain.

These are task-relative feature-necessity results. They do not establish cognitive feature deletion, and correlated predictors mean that “not necessary here” is not equivalent to “musically irrelevant.”

## Calibration and error-data boundary

Ten-bin diagnostic ECE remains small (approximately 0.02–0.03) for the compared models, but this is descriptive rather than a registered inferential metric. Aggregate reports contain no source payload. The 50 source-locatable worst-event records per target are retained only under Git-ignored `results/error_analysis_v1/` for later qualitative checking.

