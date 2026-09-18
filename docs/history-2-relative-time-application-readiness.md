# History 2.0.0 Candidate / Relative Time 0.1.0 Application Readiness Audit

Date: 2026-09-19
Status: **AUDIT COMPLETE — NO RUNTIME IMPLEMENTATION AUTHORIZED**

This document records the NarrativeLine-side readiness audit for the
non-stable History `2.0.0` candidate and Relative Time `0.1.0` draft. The
candidate specifications remain the responsibility of `e2r-spec`; this document
does not promote either candidate, define migration, or authorize application
editing.

## Authority and revisions inspected

The audit used the following authority order:

1. current NarrativeLine source and executable tests;
2. current `e2r-validator` source and accepted validator result;
3. current `e2r-spec` candidate documents and roadmap;
4. scoped `e2r-ai-knowledge` entries.

Relevant revisions at audit time:

| Repository | Branch | HEAD | Status relevant to this audit |
| --- | --- | --- | --- |
| `e2r-narrative-line` | `main` | `1de066cf71e814543cb442e0f98385f11ddbd378` | existing dirty `AGENTS.md`; not touched |
| `e2r-validator` | `main` | `5086766113b981101aad95f33e5f25a5917342b0` | clean; candidate diagnostics accepted there |
| `e2r-spec` | `main` | `25373f6d7e10a1c528346055e68072521341f854` | unrelated dirty research/work preserved |

The scoped Knowledge search found no accepted workspace decision that promotes
History 2.x or Relative Time into application behavior. The reusable guidance
applied here is to preserve repository responsibility boundaries, keep feature
implementation separate from extraction, and treat one-repository observations
as local evidence rather than as a workspace-wide rule.

## Current NarrativeLine contract

NarrativeLine currently reads and writes the stable History `1.0.0` shape:

```json
{
  "extensions": {
    "history": {
      "time": {
        "year": 1900,
        "month": 1,
        "day": 2,
        "hour": 3,
        "minute": 4,
        "second": 5,
        "temporalOrder": 10
      }
    }
  }
}
```

The relevant implementation boundaries are:

- `src/models/HistoryExtension.ts` types the current `time` object while
  retaining permissive object fields for data preservation.
- `src/services/HistoryService.ts` reads only `history.time`, validates the
  stable year-to-second fields, formats those fields, and sorts by recorded
  date/precision, `temporalOrder`, and Event ID.
- `src/services/EventService.ts` writes the stable `history.time` object when
  the existing Event History editor is saved.
- `src/screens/TimelineScreen.tsx` uses the stable comparator and displays only
  the current date/time presentation. It does not infer a date from an
  unsupported shape.
- `src/screens/EventDetailScreen.tsx` exposes only the current stable date/time
  fields for editing.
- `src/services/DatasetService.ts` preserves the parsed Dataset object after
  validation and serializes it on export; it does not normalize unknown
  extension payloads.
- `src/services/LegacyDatasetService.ts` migrates only the explicit legacy
  `narrativeline.event-date-string.v1` profile to stable `history.time`. It is
  not a History `1.0.0` to `2.0.0` migration mechanism.
- `src/services/SpecificationDeclarationService.ts` currently knows History
  only as `1.0.0` when it creates a new declaration.

The application dependency is `@sukoyaka-dopeness/e2r-validator` `^0.4.0`.
The installed application package is the registry `0.4.0` package, not the
candidate-supporting validator HEAD. Therefore the validator candidate support
accepted in `e2r-validator` is not yet an application runtime capability.

## Observed candidate behavior

Read-only import probes used the current NarrativeLine import path and the
candidate fixtures from `e2r-spec`.

| Input | Current import result | Current presentation/sort | Current edit/export boundary |
| --- | --- | --- | --- |
| History 2 `position` | accepted by the installed validator with an unsupported-version warning | no History date is read; Timeline uses the undated/ID fallback | unrelated changes preserve raw fields; History edit writes a second stable `time` object |
| History 2 `bounded-point` | accepted as a structurally usable raw Dataset with warning | no bounded interval UI or semantic order | preserved when untouched; no candidate editor |
| History 2 `temporal-extent` | accepted as a raw Dataset with warning | no extent UI or semantic order | preserved when untouched; no candidate editor |
| multiple positions / approximation | accepted as raw data with warning | no winner, midpoint, approximation, or generated date | preserved when untouched; no candidate editor |
| unknown History Feature or newer version | warning and opaque preservation | no semantic interpretation | preserved when untouched; stable History edit is unsafe |
| Relative Time `0.1.0` Relation payload | accepted with unknown-extension/specification warnings | no Timeline ordering, solver, or authoring | raw Relation payload is preserved; no semantic edit |
| unknown Relative Time Feature/version | warning and opaque preservation | no semantic interpretation | preserved when untouched |

This behavior is preservation-oriented, not semantic support. In particular,
`isValid` from the installed `0.4.0` dependency does not mean that the
candidate semantics are understood.

## Confirmed preservation/editing risk

The current History editor is not safe to use on a candidate History payload.
Given an Event with `extensions.history.assertions`, saving the existing date
editor preserves `assertions` but adds `extensions.history.time`. That creates
a mixed payload whose meaning and specification declaration are not defined by
the current app contract. The editor also has no candidate-aware refusal path.

There is a separate export risk. For a Dataset containing a candidate-shaped
History payload but no existing Specification declaration, the current export
declaration helper can add `history: 1.0.0`, because its writer capability is
key-based rather than candidate-payload-aware. An existing declaration is
preserved, but the app cannot currently authoritatively claim History `2.0.0`
support.

These are bounded application integration risks. They do not establish that
the candidate schema is wrong and do not justify an automatic migration.

The following safety properties are already present and should be retained:

- unrelated field updates use object copies and preserve unknown sibling data;
- no midpoint, placeholder date, or inferred `temporalOrder` is generated;
- Dataset replacement and pending-work safety remain separate from temporal
  interpretation;
- stable History `temporalOrder` remains a sorting tie-breaker, not a general
  partial-order solver;
- Relative Time Relation endpoints are not inferred from Relation names.

## Option assessment

### A. Preservation-only / unsupported presentation

This is the safest initial application boundary. Candidate data may be opened,
diagnosed, and preserved without semantic display or authoring. It still needs
one explicit protection: the existing History editor must refuse candidate or
unknown History shapes rather than write stable `history.time` beside them.

### B. Read-only semantic consumer

This would require a deliberate validator dependency integration, diagnostic
category mapping, candidate presentation rules, and decisions for bounded
points, extents, multiple assertions, approximation, and ordering. It is not a
single small implementation surface and is not selected for the first slice.

### C. Single-position writer

This is unsafe without an exact candidate declaration check, an explicit
single-position authoring contract, sibling preservation tests, and export
declaration ownership. It must not be implemented by reusing the current
stable History writer.

### D. Automatic stable-to-candidate upgrade

Rejected for this boundary. The existing legacy migration is a named external
profile conversion, not a History version upgrade. A candidate upgrade would
need explicit user intent and rules for temporal order, unknown fields,
approximation, and unsupported shapes. No date or assertion may be invented.

### E. All candidate shapes and Relative Time authoring

Deferred. It would combine History presentation/editing, Relative Time
Relation authoring, conflict policy, diagnostics, and round-trip guarantees.
Those are separate responsibility and product decisions.

## Selected next bounded implementation slice

The smallest safe future NarrativeLine slice is:

**`NL-H2-R1 — History 2.0 candidate recognition boundary and edit refusal`**

This slice is selected, not started. It should be limited to:

1. recognize the exact candidate declaration/payload boundary using the
   candidate-supporting validator dependency once that dependency is explicitly
   made available to the app;
2. keep candidate History payloads read-only and preservation-oriented;
3. disable or refuse the stable History date editor for candidate, unknown, or
   mixed History shapes;
4. preserve exact candidate declarations and unknown fields on unrelated edits
   and export, or fail safely when preservation cannot be guaranteed;
5. never auto-upgrade `1.0.0` to `2.0.0`, add a candidate declaration, invent a
   date, write Derived facts, or reorder the Timeline from unsupported semantics;
6. add tests for import, unrelated edit, History edit refusal, export, and
   round-trip preservation.

The validator dependency/release integration is a prerequisite decision for
this slice, not permission to change the validator or application in this
audit. The canonical production path is a normal published
`@sukoyaka-dopeness/e2r-validator` package; sibling file, workspace, or Git
dependencies are temporary evidence only. Validator SemVer policy and prior
compatible validation additions make `0.5.0` the recommended next version,
but the version bump and package release require explicit human authorization.
A later `NL-H2-R2` may consider read-only semantic presentation for a narrow,
explicitly supported position shape, but it requires separate human decisions
about display and ordering.

Relative Time remains outside `NL-H2-R1`: the app may preserve Relation payloads
and later surface validator diagnostics, but it must not sort Events from
Relative Time, author Relative Time Relations, infer semantics from names, or
write Derived Relations.

## Acceptance boundary for the future slice

The future slice is not complete until all of the following are explicit and
tested:

- exact History version and Feature declaration handling;
- stable, candidate, unknown, and mixed-shape detection;
- read-only UI state for candidate data;
- safe behavior for name/description/title and other unrelated edits;
- refusal behavior for stable History editing;
- export declaration preservation and no false `history: 1.0.0` claim;
- preservation of unknown Features and Relation payloads;
- separation of structural validity, temporal diagnostics, and Derived output;
- no Dataset schema migration and no automatic write-back of diagnostics or
  Derived results;
- EN/JA and desktop/narrow presentation decisions, if any UI notice is added;
- full application test, lint, build, and focused browser acceptance.

## Explicitly deferred decisions

The following are not implementation work for this audit:

- the normative History 2.x schema and registration status;
- the exact editor model for bounded points, temporal extents, multiple
  assertions, and approximation;
- ordering and presentation of candidate temporal values;
- History 1 to History 2 migration or upgrade UX;
- Time Zone/UTC/Instant semantics outside the accepted candidate boundary;
- Relative Time solver scope, conflict severity, derived transitivity, and
  Relation authoring;
- Temporal Frames/common-origin coordinates, calendars, worldlines, and
  multidimensional temporal perspectives;
- sample Dataset changes, public release, deployment, or publication.

## Audit conclusion

NarrativeLine can safely continue to support stable History `1.0.0` today. It
can preserve candidate-shaped History and Relative Time payloads in several
untouched paths, but it is not yet a candidate semantic consumer and its
existing History editor must not be allowed to operate on candidate payloads.

The first implementation should therefore be the narrow preservation/read-only
boundary with edit refusal, after the validator dependency question is resolved.
No application source, test, schema, Dataset, or runtime behavior was changed
by this audit.
