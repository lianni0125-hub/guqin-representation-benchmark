# Research-Stage Gate Decision Packet v1.0

**Date:** 2026-10-16  
**Technical recommendation:** PASS WITH NARROWED CLAIMS  
**Researcher decision:** APPROVED — RG1–RG10 accepted  
**Purpose:** decide whether the completed Research stage may transition to Post-research, dataset packaging and manuscript production

## 1. Gate basis

The local study has completed data freezing, canonical table construction, grouped baselines, R0–R5 comparison, equal-information architecture tests, complexity accounting, association/feature ablations, missingness and opaque-code sensitivities, piece leverage, error analysis and deterministic reruns. Research-log events E16–E29 preserve failed attempts, corrections and outcome-inspection timing.

All current Python metric/structure tests and Node table, grouping, release and leakage tests pass. Independent R4 reruns give byte-identical predictions and semantically identical summaries.

## 2. Empirical result freeze

### Primary family-level result

- R2 gesture history is the strongest confirmatory fit–economy family.
- T1 R2 improves on R5 in all ten pieces; piece-macro NLL 0.9662 versus 1.0274.
- T2 R2 piece-macro NLL is 0.2222 versus R5 0.2890.
- Atomic R0 and flat R3 have high dimensionality and unseen-state exposure.
- Separate tier main effects beat flat conjunction reliably for T1, not conclusively for T2.
- Explicit R4 association terms are unsupported after ablation.

### Feature-level result

- T2 prior right-hand direction is independently necessary: dropping it worsens 9/10 pieces, Δ +0.0287 [+0.0097, +0.0516].
- T2 prior left-hand pitch motion is not demonstrably necessary for this target.
- T2 prior left-hand timbre reduces held-out economy in the current model.
- The outcome-informed RH-direction-only diagnostic is exploratory, not a replacement confirmatory model.

### Negative/counterexample result

- T1 up-return and down-return have zero winning-label recall; they are not validated as independently recoverable computational contrasts.
- T2 errors concentrate on multi-note attacks, particularly single→multi transitions.
- Full H3 fails its association/cost requirement despite full R4's low unadjusted mean.

## 3. Research questions

| Question | Gate status | Authorized answer |
|---|---|---|
| RQ1 event/feature mapping | PARTIAL | Adequate reversible operational representation for analysed GQ39 data; not a definitive ontology or new historical-image segmentation solution. |
| RQ2 contrast/predictability | PASS WITH LIMITS | Gesture history is informative; prior RH direction is independently necessary for T2; fine-grained T1 return contrasts remain unresolved. |
| RQ3 family/economy | PASS WITH NARROWED CLAIM | Sparse gesture factorization is most economical; tier separation has limited T1 support; explicit associations/full H3 are unsupported. |

## 4. Hypothesis disposition

| Hypothesis | Disposition | Reason |
|---|---|---|
| H0 context-only | NOT SUFFICIENT | R2 and reduced gesture variants improve grouped NLL. |
| H-atomic | NOT SUPPORTED AS ECONOMICAL | R0 is high-cost/high-UNK and dominated. |
| H1 pitch-centred | PARTIAL/TASK-SPECIFIC | Helps especially in T2 but is not the best fit–cost family. |
| H2 gesture-centred | STRONGEST SUPPORT | Stable family gain; T2 RH-direction necessity localized. |
| H-flat | NOT SUFFICIENT FOR T1 | Information-matched tier main effects generalize better; T2 remains uncertain. |
| H3 full multi-tier associations | NOT SUPPORTED | Association ablation does not justify added complexity. |
| H-revise | LOCALLY TRIGGERED | Rare T1 return contrasts require caution and possible post-primary merge sensitivity. |

## 5. Phonology/Super Linguistics boundary

The empirical object, borrowed principles and ontological claim must remain separate:

- empirical object: guqin notation/action/performance sequences;
- tested phonological principles: contrast, feature factorization, contextual recoverability, tiering and economy;
- authorized programme: an external pressure test within phonology-informed Super Linguistics;
- unauthorized inference: guqin has been shown to possess a natural-language-equivalent phonology.

The mandatory positioning sentence and term substitutions are frozen in `docs/phonology_concept_boundary_and_theory_feedback.md`. An unqualified *The Phonology of Guqin* title is prohibited at this evidence level.

## 6. Higher theory-facing conclusion

The maximum theory-facing conclusion is:

> The cross-domain portability observed here lies primarily in reusable feature factorization and explicit fit–coverage–cost reasoning, not in wholesale transfer of linguistic unit labels. Complex tiers and associations bear an empirical burden, and statistical predictability is weaker than evidence for analytical or cognitive underspecification.

This is an external methodological constraint on phonological representation practice. It is not a new universal phonological law and does not invalidate association structures in language.

## 7. Dataset and release decision

The scientific contribution may include a provenance-preserving derived benchmark framework, builders, schema, codebook crosswalk, split registry, validators, tests and non-reconstructive aggregate results. Public release must still exclude unlicensed/reversible GQ39 and MusicXML payloads. Row-level predictions and worst-event locators remain restricted unless rights change.

## 8. Remaining decision: T1 return classes

Choose one before manuscript result freeze:

1. **Recommended:** retain the frozen six-way T1 primary analysis, report return-class failure, and add a clearly post-primary merged-target sensitivity analysis. This tests whether direction/return granularity caused the failure without rewriting the primary outcome.
2. Retain six-way T1 only and treat return classes solely as a limitation.

Do not silently replace the six-way target or describe a post-outcome merge as preregistered.

## 9. Post-research entry conditions

Post-research may begin only after the researcher accepts or amends:

1. the RQ1 partial/RQ2 limited/RQ3 narrowed dispositions;
2. H2 as strongest support and full H3 as not supported;
3. the phonology concept boundary and mandatory positioning sentence;
4. the higher theory-facing claim ceiling;
5. the T1 return-class handling choice;
6. the builder-based public-release boundary.

## 10. Decision table

| Gate item | Technical recommendation | Researcher decision |
|---|---|---|
| RG1 data integrity and grouping | ACCEPT | ACCEPT |
| RG2 leakage/proxy corrections | ACCEPT WITH LOGGED AMENDMENTS | ACCEPT |
| RG3 RQ dispositions | ACCEPT WITH NARROWED CLAIMS | ACCEPT |
| RG4 hypothesis disposition | ACCEPT | ACCEPT |
| RG5 error and negative results | ACCEPT | ACCEPT |
| RG6 phonology concept boundary | ACCEPT | ACCEPT |
| RG7 higher theory-facing implication | ACCEPT AT STATED CEILING | ACCEPT |
| RG8 reproducibility | ACCEPT | ACCEPT |
| RG9 dataset/release boundary | ACCEPT | ACCEPT |
| RG10 T1 return-class handling | CHOICE REQUIRED | ACCEPT — retain six-way primary and add explicitly post-primary merged sensitivity |

## 11. Technical verdict

**Research execution:** PASS.  
**Claim strength:** PASS WITH NARROWING.  
**Researcher review:** APPROVED.  
**Transition to Post-research:** AUTHORIZED. The T1 post-primary sensitivity was executed, returned a negative result, and closed under its no-further-merge rule.

