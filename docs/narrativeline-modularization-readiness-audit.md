# NarrativeLine Modularization Readiness Audit

Date: 2026-09-19

Status: **RECORDED / IMPLEMENTATION NOT STARTED**

This is a source-first modularization and readiness record. It does not
authorize a runtime refactor, History 2 implementation, or a change to Dataset
semantics.

## Authority and evidence

The assessment uses the current NarrativeLine source and tests, the current
History 2 / Relative Time application-readiness record, the current e2r-spec
roadmap, and the accepted workspace decision
`ai-knowledge/decisions/application-modularization-and-incremental-extraction.md`.
The accepted decision is applied as responsibility-based, incremental guidance;
it does not prescribe a file count, module names, or a fixed directory layout.

At the audited revision, NarrativeLine is on `main` at `83d1be8`. The source
has an existing unrelated dirty `AGENTS.md`; it is not part of this record.
The relevant source sizes are approximately:

- `src/App.tsx`: 1,186 lines;
- `src/screens/EventDetailScreen.tsx`: 635 lines;
- `src/services/HistoryService.ts`: 295 lines;
- `src/services/EventService.ts`: 216 lines;
- `src/services/DatasetService.ts`: 218 lines;
- `src/services/SpecificationDeclarationService.ts`: 129 lines; and
- `src/services/ValidationService.ts`: 34 lines.

The current tests cover stable History date/time editing and ordering, Dataset
import/export and declaration behavior, unknown-field preservation, navigation
and dirty-work safety, and production screen integration. They do not establish
History 2 semantic presentation or candidate edit refusal; those remain
NL-H2-R1 work.

## Current responsibility map

| Responsibility | Current owner | Assessment |
| --- | --- | --- |
| Application state, screen orchestration, navigation/lifecycle, dirty and pending-work coordination | `src/App.tsx` | A concentrated composition/workflow root, but not evidence for a wholesale rewrite. |
| Stable History read, validation, formatting, and Timeline comparison | `src/services/HistoryService.ts`, with `TimelineScreen` and `EventDetailScreen` presentation use | Appropriate for the current stable History contract. |
| Stable History mutation | `EventService`'s bounded History write path, called by App callbacks | Appropriate for current understood fields; not a candidate-aware policy boundary. |
| Event Detail draft and History field interaction | `EventDetailScreen.tsx`, `EventDetailDraftService.ts`, and App draft callbacks | UI/draft responsibility is separate, but candidate refusal is not yet represented. |
| Dataset import/export and exact legacy migration | `DatasetService.ts`, `LegacyDatasetService.ts` | Owns the Dataset boundary and should remain separate from temporal presentation. |
| Specification declaration preparation | `SpecificationDeclarationService.ts` | Owns declaration composition; it should not be inferred from Timeline display. |
| Core/Extension validation boundary | `ValidationService.ts` plus the published Validator dependency | Reports validator diagnostics but does not yet expose an application-level History capability classification. |
| Temporal presentation | `TimelineScreen.tsx` and History comparison/formatting helpers | Presentation/sort projection is separate from persisted History semantics. |
| Future Relative Time interpretation | Not implemented | Must remain a separate Relation-scoped responsibility from History. |

This map shows meaningful existing modularization. The presence of a large App
file alone does not justify moving files or creating generic wrappers.

## Concentration risk

The current root is a valid orchestration boundary for accepted workflows, but
NL-H2-R1 would cross several existing boundaries if implemented directly:

1. `ValidationService` would need to expose enough validator evidence for
   stable, candidate, unknown, and mixed History classification.
2. `EventDetailScreen` would need an explicit editable/read-only/refuse policy
   without embedding Dataset-shape recognition in presentation code.
3. `EventService` would need to prevent the stable `history.time` writer from
   mutating candidate or mixed payloads.
4. `SpecificationDeclarationService` would need candidate-aware declaration
   ownership and must not claim `history: 1.0.0` from a candidate-shaped
   payload.
5. `DatasetService` would need to preserve candidate declarations and unknown
   fields through unrelated edits and export.
6. `App.tsx` would continue to coordinate the resulting policy, drafts,
   pending-work state, navigation, and screen callbacks.

The known mixed-payload and false-declaration risks are therefore real
responsibility-crossing risks, not a reason to change behavior in this audit.

## Bounded extraction assessment

No broad extraction is needed before the current checkpoint, and no source
refactor is performed here.

If NL-H2-R1 is started, the smallest useful seam to evaluate first is a pure
**History capability and policy boundary**. Its responsibility would be to
classify the exact History payload/declaration relationship and provide the
application policy inputs for stable, candidate, unknown, and mixed shapes,
including whether the stable editor may write. The boundary should be defined
by behavior and contract, not by a prescribed module name.

This seam should be evaluated as a separate bounded readiness/extraction step,
or as the first isolated step of NL-H2-R1 if the human owner explicitly elects
to combine them. It should not absorb Dataset mutation, declaration
serialization, screen rendering, or navigation state.

Declaration policy and Dataset preservation remain separate responsibilities:

- declaration ownership stays with the export/declaration boundary;
- immutable Dataset updates stay with Dataset/Event services; and
- candidate presentation/refusal remains an application policy consumed by the
  screen, not a new Core or Extension semantic.

The current recommendation is therefore:

**NarrativeLine modularization follow-up: RECORDED / IMPLEMENTATION NOT
STARTED**

Next bounded checkpoint, if NL-H2-R1 is authorized:

**READY FOR BOUNDED MODULARIZATION READINESS / EXTRACTION** — define and, only
if the boundary is confirmed by the implementation plan, extract the History
capability/policy seam before spreading candidate logic across the screen,
writer, declaration, and App orchestration. This is distinct from implementing
History 2 UI or edit refusal.

## Boundaries that should not be combined

- `HistoryService` should not become a general Extension registry or Relative
  Time solver.
- `EventService` should not decide Timeline presentation or Specification
  declarations.
- `SpecificationDeclarationService` should not infer temporal meaning from
  names, presentation order, or screen state.
- `DatasetService` should not own UI refusal dialogs or navigation/lifecycle.
- `App.tsx` should not absorb candidate parsing, temporal policy, or a generic
  Dataset editor while remaining the workflow composition root.
- Relative Time should remain Relation-scoped and separate from Event-owned
  History capability. It must not be folded into History logic merely because
  both concern time.

## Human decisions still required

Before implementation, the owner must decide at least:

- the exact supported History 2 declaration/payload combinations;
- the precedence and user-facing policy for candidate, unknown, and mixed
  shapes;
- whether the first implementation refuses all candidate/mixed edits or
  supports a narrower read-only surface;
- how existing candidate declarations and unknown fields are preserved on
  export; and
- whether the capability/policy seam is a prerequisite checkpoint or part of
  the NL-H2-R1 implementation checkpoint.

Those decisions do not authorize History 2 schema changes, migration,
Relative Time authoring/order, or a runtime release.

## Validation and safety boundary

This checkpoint changes documentation only. The following are intentionally
not changed:

- runtime source, tests, schema, Core/Extension semantics, or sample Datasets;
- History writer or Specification declaration behavior;
- NL-H2-R1, History 2 UI, migration, or Relative Time consumer behavior;
- unrelated dirty or untracked work.

The appropriate documentation gates are `git diff --check` in each changed
repository and the normal e2r-spec `npm run validate` gate when the roadmap is
updated. Full application runtime gates are reserved for a source change.
