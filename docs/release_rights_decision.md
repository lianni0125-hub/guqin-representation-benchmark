# Release and rights decision v0.1

**Decision date:** 2026-10-16  
**Stage:** Pre-research / Gate 0  
**Decision:** PASS WITH A NON-REDISTRIBUTION RELEASE BOUNDARY

## What this settles

The project may create and publish a useful derived research resource, but it must not describe the first release as a repackaged row-level corpus. Public availability of an upstream repository is not treated as permission to redistribute its contents.

The releaseable contribution is a **reproducible harmonization package**:

- a project-authored canonical schema and feature crosswalk;
- local adapters/build scripts that operate on copies lawfully obtained by the user;
- deterministic piece-grouped splits, target definitions and representation registry;
- validators, synthetic fixtures, non-reconstructive aggregate statistics and provenance manifests;
- documentation of unresolved codes, missingness and source-specific transformations.

The locally built harmonized rows can support the research. They remain outside Git and outside the public archive unless every contributing source later has a redistribution basis.

## Source findings

### GQ39

The repository contains expert note-level annotation workbooks but displays no licence. Its README expressly says that the historical audio clips are copyright protected and are not uploaded. Therefore the annotations are local-use inputs only under the present evidence; the audio is excluded. We may publish our adapter, field map, checksums, citations and non-reconstructive summaries, not copies of workbook rows.

### Guqin-Dataset MusicXML

The repository displays no licence. The XML files and normalized event tables that reproduce them therefore remain local-only. The public package may contain acquisition instructions, hashes, an adapter and schema-level summaries.

### guqinMM

The repository carries an MIT licence for repository-authored software. Its README also identifies score-image and online-video sources, so the root software licence is not assumed to clear all embedded or linked cultural assets. Code reuse may follow MIT terms; images, annotations and media remain builder-only until file-level provenance is resolved.

### KuiSCIMA

The repository displays GPL-3.0. Repository-authored material may only be redistributed in a licence-compliant package with notices, source and modification records. Source facsimile rights are still checked separately. To avoid accidental licence and asset mixing, the default combined release references upstream and builds locally; a separately packaged GPL payload is optional only after file-level review.

## Three release tiers

1. **Direct after project licence selection:** our schema, code, documentation, validators, synthetic fixtures and non-reconstructive outputs.
2. **Direct with upstream terms:** specifically identified upstream-authored software/material whose licence scope is established, kept in a compatible separate package when needed.
3. **Builder/local only:** all no-licence, restricted, mixed-scope, facsimile, audio and reversible row-level material.

## Scientific consequence

This boundary does not weaken the planned phonological experiments: models can run on the lawful local build and published code can reproduce the transformation for another lawful user. It changes the dataset claim. Until permissions improve, the contribution is **an auditable harmonization and benchmark construction framework plus derived non-reconstructive metadata**, not an openly redistributed union of four payloads.

This is a conservative research-management decision, not legal advice. Rights are rechecked before publication and any archived release.

## Gate rule

`metadata/release_matrix.csv` is authoritative. Any asset with `unknown`, `restricted`, `scope_unresolved`, or `blocked_by_components` status must never have a direct payload release mode. The automated validator enforces this invariant.
