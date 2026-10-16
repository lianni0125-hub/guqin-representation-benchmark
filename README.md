# Guqin Representation Framework

[English](README.md) | [简体中文](README.zh-CN.md)

A provenance-preserving framework for building and evaluating interpretable representations of guqin notation and action sequences.

This repository does **not** redistribute the upstream row-level corpora. It provides source adapters, documented mappings, deterministic piece-grouped evaluation, representation specifications, leakage tests, aggregate reference results, and a local builder workflow for users who lawfully obtain the upstream materials.

## Scientific scope

The framework operationalizes and evaluates representation hypotheses motivated by phonological theory—contrast, feature factorization, contextual recoverability, tiering, and representational economy—on guqin notation–action sequences. It does not presuppose that guqin music possesses a phonology equivalent to the phonology of natural language.

The current reference study contains two GQ39 tasks:

- **T1:** six-class prediction of left-hand pitch motion in performed events (2,303 events);
- **T2:** prediction of score-encoded single- versus multi-note right-hand attacks (1,712 included events).

Evaluation leaves out one complete piece group at a time across ten groups. The registered representations are context-only (R5), undecomposed atomic (R0), pitch-centred (R1), gesture-centred (R2), flat joint (R3), and multi-tier (R4), with R4M as an association ablation.

## What is included

- versioned target and representation specifications;
- GQ39 local-build and audit scripts;
- training-fold vocabulary and explicit `BOS`/`MISSING`/`PREV_UNRESOLVED`/`UNK` handling;
- deterministic grouped split generation and leakage checks;
- CPU reference models and tested metrics;
- non-reconstructive aggregate reference results;
- provenance, rights, claim-boundary, and data-card documentation.

## What is not included

- GQ39 workbooks or audio;
- Guqin-Dataset MusicXML payloads;
- guqinMM or KuiSCIMA third-party images/media/annotations;
- locally harmonized event rows;
- row-level held-out predictions;
- source-locatable error cases.

See [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md) for acquisition and rights boundaries.

## Licences

Project-authored software is released under the [MIT License](LICENSE). Project-authored documentation, schemas, synthetic fixtures and original metadata tables are released under [CC BY 4.0](LICENSE-DATA). Neither licence covers any upstream corpus or third-party asset described in [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md).

## Quick start

Requirements:

- Python 3.10;
- Node.js 20 or later;
- legally obtained upstream inputs in the documented local paths.

Install the reference environments:

```powershell
python -m venv .venv-research
.\.venv-research\Scripts\python.exe -m pip install -r requirements-research-lock.txt
npm install
```

Run tests that do not require third-party data:

```powershell
.\.venv-research\Scripts\python.exe -m unittest tests.test_research_metrics
node --test tests/representation_encoders.test.mjs
node --test tests/release_matrix.test.mjs
node --test tests/research_gate.test.mjs
```

Validate the fictional fixture and run the real R2 encoding/model path end to end:

```powershell
node src/validate_public_fixture.mjs
.\.venv-research\Scripts\python.exe -m src.run_public_demo
```

The demo's 16 rows are marked `SYNTHETIC`; its scores are software checks, not scientific findings. The interchange contract is `schema/canonical_event.schema.json`. Copy `config/local_paths.example.json` to the ignored `config/local_paths.json` when preparing lawful local inputs.

After placing upstream inputs locally, build and validate the restricted analysis tables:

```powershell
node src/freeze_research_inputs.mjs
node src/build_gq39_analysis_tables.mjs
node --test tests/gq39_analysis_tables.test.mjs
```

Run a reference model:

```powershell
.\.venv-research\Scripts\python.exe -m src.run_baseline_models --target T1 --representation R2
```

See [REPRODUCIBILITY.md](REPRODUCIBILITY.md) for the complete workflow and [DATA_CARD.md](DATA_CARD.md) for appropriate use and limitations.

## Reference finding boundary

For the registered tasks, the frozen study identifies sparse gesture factorization as the best-supported trade-off among predictive fit, empirical coverage, and representational cost. The direction of the preceding right-hand gesture contributes independent information to T2. Explicit cross-tier association terms do not improve performance enough to justify their added complexity. Rare T1 return-motion categories remain unresolved, including after the post-primary merge sensitivity analysis.

These are exploratory grouped-cross-validation findings over ten piece groups. They support an external, phonology-informed test of representational organization; they do not establish the cognitive reality of the tested representations or warrant treating guqin structure as equivalent to natural-language phonology.

## Citation

Please cite the software release using [`CITATION.cff`](CITATION.cff). The associated paper should also be cited once it is available.

Author: Anni Li, University College London (UCL), [ORCID 0009-0009-0092-5752](https://orcid.org/0009-0009-0092-5752).

