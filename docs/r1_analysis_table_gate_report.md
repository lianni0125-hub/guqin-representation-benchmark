# Research R1 Analysis-Table Gate Report v1

**Date:** 2026-10-16  
**Verdict:** PASS  
**Outcome inspection:** no representation model fitted

## Canonical restricted tables

Three local-only JSONL tables were generated under Git-ignored `data/interim/gq39_analysis_v1/`:

- T1 performed left-hand motion: 2,303 rows;
- T2 eligible score right-hand attack: 1,712 rows;
- T2 exclusions: 217 rows.

Each row has a stable event ID, piece group, sequence ID, source workbook/sheet/row locator, event order, context, allowed predictor primitives, raw target, mapped target and eligibility/exclusion reason. Current acoustic pitch, contour, duration, measured performance onset and current target-derived fields are absent from predictor objects.

## Target reconciliation

### T1 primary

All 2,303 rows map to the six frozen classes:

- stationary press 1,484;
- continuous oscillation 109;
- upward motion 436;
- downward motion 167;
- up-return 54;
- down-return 53.

There are no missing targets, duplicate event IDs, sequence-order failures, or missing degree/range/score-onset controls.

### T2 secondary

Of 1,929 canonical score rows, 1,712 are eligible:

- single-note attack 1,545;
- multi-note attack 167.

The 217 exclusions are exhaustively accounted for:

- code `0`: 214;
- out-of-binary-scope code `3a`: 1;
- missing target: 2.

The earlier registry value 215 omitted the two missing-target rows and was corrected before model fitting. Eligible rows contain two missing string values and two missing left-hand timbre-technique values. These rows are retained and must receive explicit `MISSING` predictor states fitted within each training fold; they are not imputed or discarded.

## Fold feasibility

Every one of the 10 outer training folds contains every target class for both T1 and T2. Held-out pieces may lack rare classes; therefore token proper scoring, per-class support, piece-level metrics and class-absence flags remain mandatory.

## Integrity identities

- T1 table SHA-256: `c003991ff14d5a8488eeef515af674ce375b931d460db66cf9cd1c4f2dbd1adf`
- T2 eligible SHA-256: `58749d70e07445fe316d3e36fb996d63bab2221794a3e70bd0ca9eacc0c674f0`
- T2 exclusions SHA-256: `4edd01a116cd65505d4c7b923f1525251e7637c79a291d2359a807d13003f37b`

## R1 exit decision

R1 passes. Input identity, row eligibility, exclusions, missingness, ordering, group integrity and training-fold class support are deterministic and tested. The next work package is R2 baseline implementation: R5 context/physical baseline first, then R0 atomic baseline, without changing folds or targets.
