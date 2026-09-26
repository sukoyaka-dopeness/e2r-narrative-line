# H2-POSITION-CIRCA - Bounded Authoring Implementation

Date: 2026-09-19
Status: **ACCEPTED / CLOSED — BOUNDED AUTHORING SCOPE**

## Scope and authority

This checkpoint implements the explicitly approved H2-POSITION-CIRCA slice
from the e2r-spec decision preparation. The initial runtime implementation
baseline is NarrativeLine commit `72582d3` on `main`; that commit is not a
claim that the current accepted working tree is represented by one final
closure commit. Subsequent verified repair, copy, and regression-test changes
remain in the current uncommitted working tree. The History 2.0.0 Candidate
remains a non-Stable specification candidate owned by e2r-spec; this checkpoint
does not change the schema, Validator, sample Dataset, or release status.

The implementation uses the accepted incremental responsibility boundary:
History 2 mutation and declaration synchronization are isolated in
`History2Service`, while existing Event mutation, capability classification,
Timeline projection, and screen responsibilities remain at their existing
boundaries. No wholesale application refactor was introduced.

## Current repair follow-up

The declaration creation blocker found during real-browser acceptance was fixed
in the bounded follow-up recorded in
[`h2-position-circa-declaration-blocker-fix-result.md`](h2-position-circa-declaration-blocker-fix-result.md).
The repair was subsequently verified by automated regression coverage and the
original Real Browser reproduction path. The earlier pending status is
historical context; the final bounded-scope closure below supersedes it.

## Implemented boundary

- A single exact History 2.0.0 `position` assertion can be edited when the
  Dataset has the exact supported declaration.
- Position-level `approximation: "circa"` can be selected and removed.
- A Stable History 1.0.0 Event remains History 1 for ordinary exact edits.
- Selecting `circa` on a Stable Event requires explicit confirmation and
  atomically upgrades the selected Event as part of the Dataset-wide conversion
  to one History 2 position assertion per eligible History occurrence.
- Removing `circa` from an existing History 2 position keeps History 2 exact;
  it does not automatically downgrade to History 1.
- The assertion-local ID is preserved, `temporalOrder` is preserved at the
  assertion level, and exact History declarations/features are synchronized.
- Removing the last supported History 2 position removes the History payload
  and its empty declaration container atomically while preserving unrelated
  extension data.
- Unknown, unsupported, mixed, multiple-assertion, bounded-point,
  temporal-extent, and other non-approved shapes remain read-only/refused.

## Timeline contract

The approved Option A contract is implemented. NarrativeLine uses the
recorded Civil Time fields as a deterministic presentation key and visibly
labels approximate positions in localized EN/JA copy. It does not infer a
range, midpoint, finer precision, confidence, temporal relation, or Derived
fact, and it does not author `temporalOrder`. Existing recorded
`temporalOrder` remains only a bounded tie-break where applicable.

## Automated validation

The counts in this historical implementation section are the initial baseline
at commit `72582d3`. The final closure gate is recorded in the [e2r-spec
closure result](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/temporal/history-2-dataset-wide-h1-to-h2-upgrade-scope-closure-result.md)
as 24 focused tests and 251 full-suite tests passing.

The following gates passed after the implementation commit:

- `npm test`: **236 pass, 0 fail**, natural completion;
- `npm run lint`: **PASS**;
- `npm run build`: **PASS**;
- `git diff --check`: **PASS**;
- focused History 2 boundary, capability, and production integration tests:
  **14 pass, 0 fail**.

The full suite continues to emit the known Vite middleware warning that port
`24678` is already in use. The suite still exits naturally with all tests
passing. No test-infrastructure change was made for that warning.

## Human acceptance and final closure

Human and Real Browser acceptance is complete for this bounded surface. The
following contracts were verified and reconciled with the current source and
tests:

1. exact Stable History editing remains History 1, while explicit `circa`
   usage performs the Dataset-wide atomic H1 to H2 upgrade;
2. confirmation Cancel, Escape, backdrop dismissal, inside-dialog behavior,
   initial focus, and focus restoration preserve the Dataset and draft;
3. safe conversion covers Entity, Event, and Relation History occurrences,
   preserves recorded granularity, and synchronizes the exact Dataset
   declaration and Features;
4. the unsafe refusal path shows the approved feedback without confirmation,
   partial H2 mutation, draft loss, or unnecessary navigation;
5. existing H2 exact editing preserves another Event's circa payload and the
   Dataset-wide `approximation` Feature declaration;
6. circa removal keeps the H2 assertion, and the final unused Feature is
   removed without H2 to H1 downgrade;
7. Option A Timeline presentation uses recorded Civil Time without inferring
   ranges, midpoints, confidence, semantic before/after, or Derived facts;
8. EN/JA, locale switching, keyboard/focus, narrow layout, History removal,
   export/reload/re-import, and unknown/unsupported/mixed refusal behavior
   passed the bounded acceptance matrix; and
9. the canonical Relative Time fixture imported through the real file input,
   remained outside normal History/Timeline semantics, left the Dataset clean,
   and produced no console/runtime error. Relative Time preservation remains
   supported by the automated exact JSON round-trip. In the live checkpoint,
   the raw browser download artifact was not directly captured because the
   download observer timed out; no raw artifact is claimed from that run.

This is **H2-POSITION-CIRCA: ACCEPTED / CLOSED** for the bounded Candidate-
facing capability only. History 2.0.0 remains a non-Stable Candidate, and
this closure does not authorize broader History or Relative Time work.

## Explicitly outside this checkpoint

Bounded points, temporal extents, multiple assertions, occurrence, Relative
Time authoring/solving, generalized temporal ordering, Temporal Frames,
Timeline redesign, H2 to H1 conversion, Entity/Relation History authoring,
schema or Validator changes, sample/user-guide updates, History 2 Stable
promotion, and public release work remain outside this closure.
