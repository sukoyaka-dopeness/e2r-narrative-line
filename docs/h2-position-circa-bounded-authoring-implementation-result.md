# H2-POSITION-CIRCA - Bounded Authoring Implementation

Date: 2026-09-19
Status: **IMPLEMENTED / AUTOMATED GREEN / HUMAN ACCEPTANCE REQUIRED**

## Scope and authority

This checkpoint implements the explicitly approved H2-POSITION-CIRCA slice
from the e2r-spec decision preparation. The runtime implementation is
NarrativeLine commit `72582d3` on `main`. The History 2.0.0 Candidate remains a
non-Stable specification candidate owned by e2r-spec; this checkpoint does not
change the schema, Validator, sample Dataset, or release status.

The implementation uses the accepted incremental responsibility boundary:
History 2 mutation and declaration synchronization are isolated in
`History2Service`, while existing Event mutation, capability classification,
Timeline projection, and screen responsibilities remain at their existing
boundaries. No wholesale application refactor was introduced.

## Current repair follow-up

The declaration creation blocker found during real-browser acceptance was fixed
in the bounded follow-up recorded in
[`h2-position-circa-declaration-blocker-fix-result.md`](h2-position-circa-declaration-blocker-fix-result.md).
The current state is **BLOCKER BOUNDARY CLARIFIED / AUTOMATED GREEN /
REAL-BROWSER ACCEPTANCE PENDING**. This document's earlier implementation status remains
historical context; neither document marks the capability `ACCEPTED / CLOSED`.

## Implemented boundary

- A single exact History 2.0.0 `position` assertion can be edited when the
  Dataset has the exact supported declaration.
- Position-level `approximation: "circa"` can be selected and removed.
- A Stable History 1.0.0 Event remains History 1 for ordinary exact edits.
- Selecting `circa` on a Stable Event requires explicit confirmation and
  atomically upgrades that Event to one History 2 position assertion.
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

## Human acceptance remaining

This result is not ACCEPTED or CLOSED. Human acceptance should verify, in the
actual product, at minimum:

1. exact Stable History editing remains History 1;
2. selecting `circa` presents the upgrade explanation, and Cancel leaves the
   original Dataset unchanged;
3. confirming the upgrade preserves the recorded granularity and shows the
   localized approximate label;
4. an existing History 2 exact position can be edited without downgrade;
5. removing `circa` keeps the H2 assertion and declaration;
6. Timeline ordering does not imply semantic before/after beyond the recorded
   presentation projection;
7. EN/JA, narrow layout, keyboard/focus, export/reload round trip, and
   unrelated unknown/Relative Time data preservation work as intended.

The human acceptance result must separately decide whether this bounded
Candidate-facing capability is suitable for its intended product audience.
It must not promote History 2.0.0 to Stable or authorize broader History or
Relative Time work.

## Explicitly outside this checkpoint

Bounded points, temporal extents, multiple assertions, occurrence, Relative
Time authoring/solving, generalized temporal ordering, Temporal Frames,
Timeline redesign, schema or Validator changes, sample/user-guide updates,
and public release work remain outside this implementation.
