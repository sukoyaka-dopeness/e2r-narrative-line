# NarrativeLine Relative Time 0.2.0 User-Facing Slice — Implementation Result 1

- Date: 2026-09-26
- Status: **IMPLEMENTED / AUTOMATED GREEN / REAL-BROWSER ACCEPTANCE PENDING / NOT RELEASED**
- Scope: NarrativeLine application behavior for the Relative Time `0.2.0`
  Candidate only; no specification or Validator change.

## Human-adopted design

The Human authorized the first user-facing Relative Time milestone to include
both authoring/editing and meaningful Timeline placement for undated Events.
The selected first slice is:

- Event-to-Event `relative-position` assertions using only `before` and `after`.
- Pairwise-constraint Timeline presentation. Constraint chains may contribute
  to a display-only placement projection; incomparable Events are not
  represented as a recorded total order.
- Participation is restricted to Events without any History payload,
  `temporalOrder`, or legacy date field. This intentionally excludes partial
  and approximate History and does not interleave dated Events with undated
  Events.
- Cyclic connected groups suppress only their Relative Time projection and
  show a localized diagnostic; the existing Timeline list remains the
  fallback. The application does not select a winning assertion or repair
  imported conflicts.
- A new writer creates at most one Relative Time `relative-position`
  Relation per Event pair. Existing independent assertions remain separate
  and individually editable. No inverse Relation is created.
- An obvious direct contradiction is refused for a new assertion or an edit;
  existing imported Relations are preserved. No Relation deletion, bulk edit,
  Entity endpoint, or other Relative Time Feature is included.
- The first explicit write declares the exact Relative Time Extension identity
  at `0.2.0` and includes `relative-position` in the used Feature set. Existing
  known exact uses are preserved. An opaque undeclared Relative Time payload,
  `0.1.0`, unsupported exact version, or incomplete competing contract is not
  upgraded or reinterpreted; authoring is refused and source data remains
  unchanged.

The Relative Time `0.2.0` Draft remains Candidate. The application treats
Relation endpoint orientation and Relation names as non-semantic. `before` /
`after` does not create dates, duration, elapsed days, interval endpoints, or
History facts. Recorded Relations remain the only persisted assertions; the
projection writes no inferred Relation, rank, date, `temporalOrder`, or other
Dataset value. Stable History ordering remains separate and unchanged.

This bounded user-facing implementation follows the adopted atomic Recorded
semantics and the current
[Relative Time 0.2.0 Draft](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/extensions/relative-time-0.2.0-draft.md).
It does not amend either authority. The earlier
[scope-preparation record](./relative-time-0.2.0-user-facing-milestone-scope-preparation1.md)
retains its alternatives as a historical preparation snapshot; this result
records the selected implementation boundary.

## Implementation evidence

- Added an isolated Relative Time service for exact-version gating, first-write
  Specification declaration, individual assertion authoring/editing,
  eligibility, cycle detection, and display-only partial-order placement.
- Added bilingual Event Detail controls using native select/button controls.
  Existing History, partial/approximate, dated, old-version, and unsupported
  data are not editable through this panel.
- Added a separate Timeline projection panel. It leaves the pre-existing
  History/date comparator and event list order unchanged, names recorded
  pairwise assertions, identifies incomparable pairs, and suppresses cyclic
  components with EN/JA diagnostics.
- Mutations preserve unrelated Dataset fields and are refused unless the
  resulting Dataset passes the published Validator. No automatic migration or
  repair occurs.
- Automated coverage checks exact declaration creation, no inverse Relation,
  version refusal, contradiction refusal, editing separate existing Relations,
  unrelated sibling-data preservation, qualitative direction, chains,
  incomparability, cycle suppression, History exclusion, and EN/JA UI.

## Verification and remaining acceptance

- Focused service and UI integration tests: **9/9 PASS**.
- Full NarrativeLine test suite: **273/273 PASS**.
- E2R-SPEC `npm run validate`: **PASS** after the minimal Roadmap sync.
- Lint/build are rerun for this final source state below before commit.
- No real-browser acceptance was performed in this checkpoint. Human visual
  and keyboard/focus acceptance, including narrow viewport and ordinary
  author/edit/export/re-import, remains required before calling the user-facing
  milestone accepted.

This record does not claim Manual Acceptance, application release, or
deployment. NarrativeLine remains a local `0.2.0` candidate; Credits release
date remains for the actual deploy day. Relative Time `0.2.0` and History
`2.0.0` remain Candidates. No push, tag, release, or deploy was performed.
