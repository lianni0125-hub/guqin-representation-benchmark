# External Data Reuse Decision v0.1

**Date:** 2026-10-16  
**Decision:** reuse existing structured data; do not make OCR or exhaustive glyph segmentation a research objective

## 1. Adopted data-entry architecture

The formal/computational phonology study begins from existing symbolic or expert-annotated representations. Historical images are retained only for provenance checks, error audits and a small number of adjudicated examples.

```text
existing structured annotations
  -> source-specific adapter
  -> source-preserving intermediate records
  -> project feature views R0-R5
  -> grouped representation-learning evaluation
```

No external category is automatically treated as phonological. Adapters preserve the source label and provenance before any project-specific feature mapping.

## 2. Sources selected

### A. KuiSCIMA v2.0 / `015_guyuan` - primary sequential structure pilot

- Repository version audited: commit `89f98a2afa0593b8a93a4a782607e4ad501f2243`.
- Repository licence: GPL-3.0.
- The symbolic edition explicitly declares `notation_type: Jianzipu`.
- It contains 143 ordered music items: 112 `FULL_JIANZIPU`, 19 `STRING_NUMBER`, and 12 `LEFT_HAND` items.
- Its trees contain left-hand, right-hand, technique, number and ideographic-layout information.
- Five optical editions provide matching `015_guyuan.json` records for source/edition comparison.

**Use:** primary pilot for sequential context, continuation/left-hand-only items, and conversion into R0-R5. It is one piece and therefore cannot by itself support piece-held-out generalization.

### B. guqinMM / JZPNet - historical symbol-coverage and external-baseline source

- Repository version audited: commit `a95da53b4f63d3e26d5aa8fde368367555d2a70a`.
- Repository-level licence: MIT; third-party score-image provenance remains a separate question.
- Local audit finds 7,883 image files, a 128-label node dictionary, and 213 non-header real records in the `wushen_1` metadata partition.
- A further 5,302 rows in `wushen_aug` are augmented data and must never be counted as independent historical observations.
- Labels linearize hierarchical structures and distinguish left hand, right hand, technique, number and layout operators.

**Use:** symbol/structure inventory coverage, comparison baseline and possibly local training diagnostics. Do not redistribute its image crops until file-level provenance is resolved. Do not use augmented samples for historical-frequency or generalization claims.

### C. GQ39 - multi-piece technique/pitch comparator

- Repository version audited: commit `f5370f70073f501fc29f87490f30f81e8408fee9`.
- Contains expert note-level annotations for 31 score sections from 10 compositions and 39 performance clips.
- Score files distinguish pitch/degree/range/duration, string and right/left-hand technique variables.
- Audio is not distributed; the repository states it remains copyrighted.
- No repository licence file was located.

**Use:** local, non-redistributed comparator for multi-piece pitch/technique structure and possible held-out-piece feasibility. Public release must contain adapter code and provenance, not copies of unlicensed annotations, unless permission or a clear licence is obtained.

### D. `lukewys/Guqin-Dataset` - pitch-only multi-piece baseline

- Repository version audited: commit `e7feb0c2e7e4a5ba471c70723e7f81b9ae893902`.
- Contains 71 whole-piece MusicXML files and 408 phrase/section MusicXML files.
- The project states that melody and overtone notation were transcribed from modern published numbered-notation scores; other notation was ignored.
- No repository licence file was located.

**Use:** pitch-only R1 baseline and group/split prototyping, not a gesture-rich or historical-*jianzipu* ground truth. Do not redistribute source-derived XML until permission/licence is clarified.

### E. `alephpi/jianzipu` - interface and parser baseline, not bundled dependency

- Repository version audited: commit `a5174e47855881a4e3ca1d414fc706c0a213d26a`.
- The package classifier says AGPLv3+, while the repository README ends with “All rights reserved.”
- The checked glyph inventory has 144 entries and the documentation supplies a formal grammar and layout system.

**Use:** documented-interface comparison and optional local baseline only. Do not copy or vendor its code until the licence inconsistency is clarified.

## 3. Tested adapters

- `src/import_kuiscima_guyuan.mjs` converts the ordered *Guyuan* JSON into source-preserving JSONL and marks `LEFT_HAND` items as dependent on the previous sounding event without inventing a visible right-hand component.
- `src/import_guqinmm_wusheng.mjs` converts the 213 real `wushen_1` metadata rows into ordered source-preserving JSONL; imported labels remain explicitly unverified external annotations.
- `src/audit_reused_sources.mjs` recomputes repository-level counts and licence warnings.

The generated pilot outputs remain under Git-ignored `results/reuse_pilot/`; source data remain under Git-ignored `external/`.

## 4. Final decision for Paper 1

1. Stop expanding manual image segmentation.
2. Use KuiSCIMA *Guyuan* as the first end-to-end representation pilot.
3. Use guqinMM real (not augmented) annotations for historical symbol/structure coverage and error comparison.
4. Use GQ39 for multi-piece expert technique variables if its annotation terms can be normalized without collapsing distinctions.
5. Use the 71-piece MusicXML collection only as a pitch-only comparator.
6. Perform a small source-image audit on each adopted source rather than retranscribing whole works.
7. Do not call the combined sources one homogeneous corpus; retain dataset, work, edition and annotation-system group identifiers in every split.

## 5. Remaining blockers

- Define a cross-source feature crosswalk without forcing unlike annotation systems into false equivalence.
- Obtain permission/clarification for redistribution of GQ39 annotations and the MusicXML corpus, or release download/adaptation code only.
- Resolve whether guqinMM's MIT notice covers project-created annotation metadata separately from third-party images.
- Establish at least three defensible work/source groups for held-out evaluation; augmented samples never count toward this requirement.

## 6. Route freeze

The reuse-first route is the primary Paper 1 data strategy. OCR-assisted creation of a new facsimile transcription corpus is removed from the critical path because it would require human proofreading outside the paper's formal/computational phonology focus. Gate 0 now requires a cross-source harmonization pilot, not a manual-transcription or OCR-accuracy pilot.

