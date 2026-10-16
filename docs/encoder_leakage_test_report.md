# Minimal encoder and leakage-guard test report

Status: **PASS**  
Date: 2026-10-16  
Scope: synthetic implementation tests only; no real representation-model outcome was computed

## Implemented artifacts

- `experiments/encoder_spec_v0_1.json`: exact input groups, lags, missing tokens and forbidden current-event fields for both frozen targets;
- `src/representation_encoders.mjs`: grouped splitting, independent-row selection, R0–R5 token construction, training-only vocabulary fitting and `UNK` application;
- `tests/representation_encoders.test.mjs`: seven synthetic safeguards.

## Tests passed

1. **Piece-family isolation:** all score, performance and duplicate-template rows of a held-out piece remain outside training.
2. **Duplicate exclusion:** performance-workbook score templates are excluded from the independent-sample selector.
3. **Training-only vocabulary:** a value appearing only in a held-out piece never enters the training vocabulary and becomes `UNK`.
4. **Current-target leakage rejection:** T1 rejects current acoustic pitch/trajectory fields and the target field; T2 rejects right-finger multiplicity.
5. **R3/R4 primitive equality:** both representations access exactly the same current controls and lagged pitch/gesture primitives.
6. **No future context:** changing a future event leaves the current encoding identical under R0–R5.
7. **Explicit sequence boundary:** the first event receives `BOS`; it is not filled from a later event.

The pre-existing annotation validator also passed its positive round-trip and negative bounding-box tests.

## Interpretation

The tests establish that the implementation can enforce the registered information boundary. They do not establish that any representation predicts well, that R4 is justified, or that the target is phonological. Those are Research-stage empirical outcomes.

## Reproduction

From the repository root:

```powershell
node src/validate_experiment_registry.mjs
node --test tests/*.test.mjs
powershell -ExecutionPolicy Bypass -File tests/test_annotation_validator.ps1
```

Any change to the registry or encoder specification must rerun these tests. Adding a field to R3 or R4 requires an explicit equality test and a dated protocol amendment.
