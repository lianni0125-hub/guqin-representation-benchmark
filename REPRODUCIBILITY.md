# Reproducibility

## Frozen reference environment

- Python 3.10.20
- NumPy 2.2.6
- SciPy 1.15.3
- scikit-learn 1.7.2
- Node.js reference run: 25.8.2
- SheetJS/xlsx: 0.20.3 (official SheetJS CDN tarball)
- random seed: 20261016

The estimator is CPU-only regularized logistic regression. A GPU is not required.

## Reproduction layers

### Layer A — public unit tests

Runs without third-party data and validates metrics, representation boundaries, vocabulary isolation, release rules and Gate/claim invariants.

The standalone smoke path also validates the fictional fixture and runs the actual R2 encoder, training-fold vocabulary, logistic model and leave-one-piece-out loop. Its scores test software plumbing only and carry no empirical interpretation.

### Layer B — local builder integration

Requires lawfully obtained upstream inputs. It freezes input identities, constructs restricted analysis tables, accounts for exclusions/missingness, and verifies piece-group integrity.

### Layer C — model reproduction

Runs nested grouped regularization selection inside each leave-one-piece-out fold. Vocabulary and unknown-state decisions are fitted within the relevant training fold.

### Layer D — aggregate reports

Summarizers regenerate the R3 comparison, R4 robustness, R5 feature ablation and error-audit aggregates. Row-level predictions remain ignored and local.

## Canonical run order

1. install locked Python and Node dependencies;
2. acquire upstream data and place it outside version control as described in `THIRD_PARTY_DATA.md`;
3. run input freeze and table builders;
4. run all unit/integration tests;
5. run R5, R0, R1, R2, R3, R4M and R4 for T1/T2;
6. run registered diagnostics/sensitivities only with their recorded tags;
7. generate aggregate summaries;
8. compare output hashes with the research result manifest.

The original study preserves an append-only research log. Public users do not need its internal source locators to reproduce the registered protocol.

## Determinism boundary

Independent reference reruns produced byte-identical R4 prediction files for both targets and semantically identical summaries. Platform/library changes may alter low-level floating-point serialization; scientific reproduction should additionally verify fold membership, selected C values, per-piece scores and stated tolerances.

