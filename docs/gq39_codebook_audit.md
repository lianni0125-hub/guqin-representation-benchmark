# GQ39 codebook and observed-code audit

Status: **completed for pre-research use; interpretation remains conservative**  
Audit date: 2026-10-16

## Question resolved

GQ39 does not lack all first-party documentation. Every distributed workbook contains an author-supplied `說明:` area to the right of the annotation columns. It functions as an embedded codebook, although it is neither a separately versioned codebook nor fully exhaustive.

Accordingly, GQ39 remains usable for Paper 1. The raw codes are the authoritative retained layer; semantic labels are added only when an embedded instruction explicitly supports them.

## Scope and reproducible outputs

`src/audit_gq39_codebook.mjs` scanned:

- 71 `.xlsx` workbooks: 32 score and 39 performance workbooks;
- 121 worksheets, including multi-section pieces;
- 7,246 populated rows across all worksheets, including auxiliary performance/pitch-contour sheets;
- 4,273 rows with at least one audited full-gesture field, of which 2,344 are score-template copies inside performance workbooks rather than independent gesture samples;
- 24,916 non-empty cells in the six gesture-related fields;
- 2,636 populated instruction cells, comprising 44 distinct strings.

Machine-readable outputs:

- `metadata/gq39_codebook_audit.json`: workbook, sheet, instruction-location and coverage audit;
- `metadata/gq39_observed_codes.csv`: every observed raw field value, frequency, and documentation status;
- `metadata/gq39_codebook_map.csv`: conservative source-to-project mapping.

The counts correct an earlier first-worksheet-only estimate while avoiding the opposite error of treating every auxiliary worksheet as an independent gesture annotation. Subsequent GQ39 analyses must select the intended data layer explicitly.

## What the embedded instructions establish

### Right hand

`R finger` is compositional: digits `1–5` encode finger identity and `a/b` encode inward/outward direction. The author gives `1b` (thumb outward) and `3a` (middle finger inward) as examples. The instructions do **not** provide a complete digit-to-finger-name table, so the project may decompose direction but must retain the digit rather than fill all anatomical names from domain knowledge.

For `R tech`, nine workbooks explicitly state `1 = 單音` and `2 = 撮或潑剌等等之類的雙音`; 62 contain only the looser wording `撮或等等之類`. Code `2` is therefore a broad multi-note attack class, not evidence for a particular named technique.

### Left-hand pitch technique

All workbooks document the major classes `1–6`: stationary press, continuous oscillation, upward motion, downward motion, up-and-return and down-and-return. They also consistently document `3a`, `3b`, `4a`, `4b`, `5a`, `5b`, `5c`, and `6a`.

Nine expanded-codebook workbooks add some finer codes. Six use `3c–3e`; three contain the apparent typo `3:c`; nine define `4c` and `5d`. These are retained as versioned variants rather than silently imposed on every workbook.

Crucially, code `2` groups `吟猱` as continuous oscillation. It cannot supervise or evaluate a model that claims to distinguish `吟` from `猱`.

### Left-hand timbre and left-hand finger

All workbooks state `1 = 泛音` and `2 = 散音`. Nine additionally state `3 = 一般按音` and `4 = 特殊按音`; these latter meanings are variant-scoped.

No embedded instruction maps `L finger` numbers to anatomical finger names. The whole field therefore remains an opaque categorical variable until a first-party definition is located.

## Unresolved values and formatting risks

Observed but undocumented values include:

- `0` in several fields;
- `R tech = 3a`;
- pitch-technique atoms such as `2b`, `6b`, `7*`, `8*`, and performance-side `4d`;
- decimal-like values such as `0.1`, and comma-delimited bundles such as `3a,3b`;
- one `4a.3b` value, likely a delimiter inconsistency but not automatically corrected.

These values are not rare enough to delete globally. In particular, `0` accounts for much of the unresolved coverage. Until its meaning is evidenced, it is an **unknown/unspecified source value**, not automatically “absence of technique.”

The audit's conservative documented-cell rates, before excluding the wholly undocumented `L finger` field, range from approximately 47% to 89% by corpus and field. These are lower bounds: a code is counted as documented only if every atomic component is supported by the embedded instructions.

## Frozen handling policy

1. Preserve `raw_code`, source workbook, worksheet and row.
2. Store author-supported meaning separately as `author_label`.
3. Store the project's cross-source abstraction separately as `normalized_feature`.
4. Never replace raw codes with labels.
5. Treat comma-delimited forms as bundles/sequences, not new atomic techniques.
6. Treat `0`, decimals, `7*`, `8*` and other undocumented atoms as `UNRESOLVED`, not as negative evidence.
7. Use coarse labels for broad source categories: `2` remains continuous oscillation and does not become either `吟` or `猱`; `R tech = 2` remains a multi-note attack class.
8. Version-scoped definitions (`3c–3e`, `4c`, `5d`, timbre `3–4`) require workbook-level provenance.
9. No research claim may depend solely on an unresolved code family.

## Consequence for Paper 1

The audit does not block representation learning. The independent full-gesture score layer contains 1,929 rows; the separate performance-measurement layer contains exactly 2,303 note rows, matching the repository's piece list. It improves the design by separating three questions:

- Can a model learn structure from raw categorical codes?
- Do learned representations recover documented broad gesture classes?
- Do compositional components such as finger digit and movement direction behave as separable features?

The strongest confirmatory analyses should use documented coarse classes and transparent inclusion counts. Fine-grained or undocumented codes may enter unsupervised input representations and exploratory analyses, but not gold-label evaluation or named-technique claims.

## Gate decision

**PASS WITH CONDITIONS.** GQ39 remains the principal joint pitch/gesture comparison corpus. Before experiment freeze, the full-corpus grouping audit must quantify results both with all raw tokens and with a documented-only evaluation mask. Any paper text must describe the workbook-embedded instructions and their incompleteness.
