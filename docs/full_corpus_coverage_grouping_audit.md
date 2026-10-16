# Full-corpus coverage and grouping audit

Status: **Gate C — PASS WITH CONDITIONS**  
Audit date: 2026-10-16

## Decision

The four reused sources are sufficient to begin a defensible first paper, but they do not form one homogeneous corpus. Their roles must remain distinct:

- **GQ39** is the primary common pitch/gesture corpus for RQ2 and RQ3;
- **Guqin MusicXML** is a large pitch-sequence baseline and external robustness source, not a gesture corpus;
- **KuiSCIMA v2.0 jianzipu** is a provenance/sequence/representation-design source, not a large independent guqin sample;
- **guqinMM** is a token-structure and decomposition source; augmented/training derivatives are not independent historical observations.

Gate C passes because GQ39 supplies ten piece groups with recurrent pitch/gesture categories and MusicXML supplies a substantially larger pitch-only comparison. It passes conditionally because GQ39 has only ten independent piece groups, several fields contain undocumented codes, performer and piece are partially confounded, and no honest random note-level split is possible.

## GQ39: correct data layers

The repository contains three analytically different layers:

| Layer | Size | Independence decision |
|---|---:|---|
| Canonical score/full-gesture worksheets | 1,929 rows in 32 score workbooks | Primary gesture layer; 31 stated score sections, plus the two `yi07` mode versions |
| Full-gesture worksheets copied into performance workbooks | 2,344 rows | Exclude as additional samples; these are score-template repetitions |
| Separate performed-technique/acoustic worksheets | 2,303 rows in 39 clips | Performance layer; exactly matches the declared `n_note` total |

Thirty exact full-sequence duplicate groups connect score worksheets to the corresponding templates in performance workbooks. Some score sections are copied into multiple clips. A random note, worksheet, section, or clip split would therefore leak essentially identical sequences between training and evaluation.

### Independent grouping

The highest defensible grouping key is `piece_group`, yielding ten groups:

- 秋風詞, 鳳求凰, 古琴吟, 關山月, 酒狂;
- 良宵引, 湘江怨, 陽關三疊, 憶故人, 玉樓春曉.

All score variants, sections, repeated performance clips and corresponding acoustic rows for a piece must remain in the same fold. `yi07_modulation`, `yi07_originalmode`, and `yi07_p` are one family for splitting.

There are five named performers, but performer is not crossed independently with repertoire: 李楓 accounts for five pieces, 許光毅 and 張子謙 two each, and 陳心園 one. Performer effects therefore cannot be cleanly separated from piece effects. They can be reported as sensitivity/descriptive analyses, not as independently identified causal effects.

### Split decision

The frozen safe evaluation design for GQ39 is:

1. outer leave-one-piece-out grouped cross-validation (10 outer folds);
2. any model/representation selection performed only inside the remaining piece groups;
3. preprocessing vocabularies and frequency thresholds fitted within the training fold;
4. no note-level shuffling across pieces;
5. aggregate and per-held-out-piece results both reported;
6. repeated performance clips retained in the same piece fold and never treated as independent score evidence.

With only ten groups, a permanent train/development/test partition would produce unstable conclusions and waste too much evidence. Under the predeclared study protocol, RQ3 results should therefore be labelled **grouped-cross-validation exploratory evidence**, not a single untouched-test confirmation.

## GQ39 target coverage

`metadata/gq39_target_support.csv` records each raw value's token count, number of piece groups and number of source units. This audit deliberately reports recurrence rather than inventing a universal minimum count.

The following documented broad classes recur sufficiently widely to remain candidate targets or evaluation strata:

- right-hand single-note versus broad multi-note attack (`R tech` 1/2);
- right-hand inward/outward direction after separating the documented `a/b` component;
- left-hand stationary, continuous-oscillation, upward, downward, up-return and down-return supercategories;
- left-hand timbre categories where workbook-specific documentation supports them;
- string and coarse position information as physical/notational controls;
- performed left-hand pitch-technique supercategories in the 2,303-row performance layer.

Raw `0`, `7*`, `8*`, decimal-like and otherwise undocumented codes may be retained as opaque input/missingness states but cannot define confirmatory named-technique targets. `L finger` remains opaque because no author-supplied digit-to-finger mapping was found.

The target audit supports a broad-class experiment. It does not support fine-grained evaluation of every named technique, nor a separate `吟` versus `猱` target.

## Other three sources

### Guqin MusicXML

- 71 whole-piece MusicXML files;
- 39,623 notes;
- 62–2,053 notes per piece, median 439;
- no identical whole-piece pitch sequence detected by the audit.

This is adequate for pitch-only sequence baselines and external evaluation of pitch-centred representations. Because expressive and most technique marks were intentionally omitted by the dataset creators, it cannot by itself adjudicate gesture-centred versus multi-tier representations.

### KuiSCIMA v2.0

The full symbolic edition contains 116 JSON files and 8,030 `Music` records across several historical Chinese notation systems. Only 143 typed records in the audited material are explicitly jianzipu-related (`112 FULL_JIANZIPU`, `19 STRING_NUMBER`, `12 LEFT_HAND`); the same small typed subset appears in the normalized edition.

Consequently, the headline “109 pieces” must not be misreported as 109 guqin/jianzipu pieces. For this paper KuiSCIMA is a high-value sequence/provenance and cross-notation design reference, but not an independent large jianzipu training corpus.

### guqinMM

Five metadata lists contain 8,278 rows in total, but 5,302 are in `wushen_aug` and 2,651 in `wushen_train`. These are derived/augmented training assets and cannot be counted as 7,953 independent historical tokens. The clearly separated `wushen_1` list contains 213 rows; `zyt` contains 109 rows whose provenance still requires clarification.

guqinMM therefore supports component-tree and token-structure analysis. It does not multiply the number of independent pieces merely through augmentation.

## Leakage and validity rules now frozen

1. Split by piece/family, never by token or worksheet.
2. Deduplicate score-template copies before counting sample size.
3. Keep source-specific observation layers separate; do not pool MusicXML pitch notes with GQ39 gesture rows as if identically annotated.
4. Fit code vocabularies, rare-category handling and normalization on training folds only.
5. Report documented-only evaluation alongside raw-code exploratory analyses.
6. Treat performer effects as partially confounded with piece.
7. Treat augmentation as training transformation, never independent evidence.
8. Report per-piece performance and instability rather than only a pooled score.

## What can now be frozen, and what remains

The split unit and source roles are now frozen. The next Gate 0 task is to freeze one primary target, one secondary target, metrics and representation inputs. The recommended starting comparison is a broad left-hand pitch-technique target because it is present in both score and performance layers, with right-hand attack/direction as the secondary score-side analysis. Exact target encoding must first apply the documented-code mask from the GQ39 codebook audit.

## Reproducible outputs

- `src/audit_full_corpus_grouping.mjs`
- `metadata/full_corpus_grouping_audit.json`
- `metadata/gq39_piece_groups.csv`
- `metadata/gq39_target_support.csv`

