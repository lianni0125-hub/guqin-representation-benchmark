# Data Card

## Resource identity

**Name:** Guqin Representation Framework  
**Form:** builder-based dataset and evaluation framework  
**Version:** release candidate 0.1  
**Primary language of documentation:** English, with source labels preserved where required

## Intended purpose

The resource supports reproducible comparison of interpretable representations of guqin notation–action sequences. It is intended for research on symbolic music representation, computational/formal phonology, Super Linguistics, digital musicology, and evaluation methodology.

It is not an openly redistributed union of upstream corpora. Users must obtain upstream inputs under their respective terms and run the local builders.

## Upstream source roles

- **GQ39:** principal joint pitch/gesture evidence and both registered prediction targets;
- **Guqin-Dataset MusicXML:** pitch-oriented auxiliary source;
- **KuiSCIMA:** structural/schema evidence;
- **guqinMM:** notation-structure/schema evidence.

These sources are not treated as homogeneous independent performances and are not pooled by complete-case imputation.

## Registered units and targets

The experimental unit is a source-locatable note-aligned event embedded in a within-piece sequence. The framework preserves raw codes, documented mappings, source/sheet/row provenance locally, and typed missing/unresolved states.

- T1 contains 2,303 eligible performed events in six broad left-hand motion classes.
- T2 contains 1,712 eligible score events: 1,545 single-note and 167 multi-note attacks. A further 217 rows are excluded with explicit reasons.

The ten outer groups correspond to complete piece groups. Rows, versions and duplicated templates from a held-out piece cannot enter training.

## Sensitive and personal data

The framework is not designed around personal or sensitive attributes. Upstream historical/cultural materials, performer metadata, images and recordings may nevertheless carry rights, attribution and cultural-context obligations. This release excludes audio, facsimile payloads and row-level upstream annotations.

## Known limitations

- only ten independent piece groups;
- class imbalance, especially T1 return motions and T2 multi-note attacks;
- no independent hidden test server or community leaderboard;
- grouped-CV evidence is exploratory rather than population-wide confirmation;
- GQ39 code meanings are used only when documented by the source;
- the operational event representation does not settle the ontology of all historical jianzipu tokens;
- no cognitive, perceptual or performer-intention inference is licensed;
- a post-primary merge of T1 return directions did not make return motion reliably recoverable.

## Appropriate uses

- reproduce registered grouped representation comparisons;
- test interpretable alternative representations under the same information boundary;
- audit leakage, missingness and representation cost;
- extend the builder to lawfully obtained compatible sources while preserving provenance;
- teach reproducible evaluation and claim-boundary practice.

## Inappropriate uses

- reconstruct or republish upstream corpora from local outputs;
- treat source code `0` or undocumented codes as “no technique”;
- use row-wise random splits across the same piece;
- infer performer cognition, skill or identity;
- claim that guqin is a language or that the framework establishes a guqin phonology equivalent to language phonology;
- use the reference results as a universal ranking of model families.

## Rights and access

See [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md). The release contains only project-authored code/documentation and non-reconstructive aggregates. Upstream payload rights remain with their respective creators and rights holders.

