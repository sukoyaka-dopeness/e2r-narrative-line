# NarrativeLine Relative Time 0.2.0 User-Facing Slice — Implementation Result 1

- Date: 2026-09-26
- Status at initial checkpoint: **IMPLEMENTED / AUTOMATED GREEN / REAL-BROWSER ACCEPTANCE PENDING AT THAT CHECKPOINT / NOT RELEASED**
- Scope: NarrativeLine application behavior for the Relative Time `0.2.0`
  Candidate only; no specification or Validator change.

## Current History-aware behavior (2026-09-27)

NarrativeLine now allows Recorded Relative Time assertions to be created,
listed, and edited for Events with or without History/date information, as
long as the Dataset's Relative Time authoring contract is supported. This
supersedes the initial History/date-free authoring restriction recorded
below. The History/date-free boundary remains a Timeline projection rule:
Relations with a History/date endpoint remain outside the current display-only
Relative Time projection. Mixed Timeline placement and History/Relative Time
consistency diagnostics are not implemented.

## Initial first-slice design (2026-09-26; authoring restriction superseded 2026-09-27)

The Human authorized the first user-facing Relative Time milestone to include
both authoring/editing and meaningful Timeline placement for undated Events.
The selected first slice is:

- Event-to-Event `relative-position` assertions using only `before` and `after`.
- Pairwise-constraint Timeline presentation. Constraint chains may contribute
  to a display-only placement projection; incomparable Events are not
  represented as a recorded total order.
- In the initial first slice, participation was restricted to Events without any History payload,
  `temporalOrder`, or legacy date field. This intentionally excludes partial
  and approximate History and does not interleave dated Events with undated
  Events. The History/date restriction was later removed for Recorded
  authoring and remains only on the current Timeline projection.
- Cyclic connected groups suppress only their Relative Time projection and
  show a localized diagnostic; the existing Timeline list remains the
  fallback. The application does not select a winning assertion or repair
  imported conflicts.
- A new writer creates at most one Relative Time `relative-position`
  Relation per Event pair. Existing independent assertions remain separate
  and individually editable. No inverse Relation is created.
- Editing an existing Relation may replace its `before`/`after` direction while
  retaining that Relation ID. This replacement is distinct from adding a new
  independent Relation; only a resulting conflict with another independent
  assertion is a direct contradiction. The first-slice one-new-assertion-per-
  pair limit is an application product boundary, not an E2R model constraint.
- An edit may replace the direction on its same Relation ID. Creating or
  editing an assertion is refused only when the resulting assertion directly
  conflicts with another independent Relation; existing imported Relations are
  preserved. No Relation deletion, bulk edit, Entity endpoint, or other
  Relative Time Feature is included.
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
  projection eligibility, cycle detection, and display-only partial-order
  placement. Current Recorded authoring eligibility is independent of Event
  History/date; projection eligibility remains History/date-free.
- Added bilingual Event Detail controls using native select/button controls.
  The current panel lists and edits Recorded assertions for History/date-bearing
  Events when the Dataset contract is authorable. Ordinary UI copy does not
  expose Relation IDs. Each record has its own update control, separate from
  the new-assertion form; editing replaces the same Relation and adding creates
  another one. Unsupported Relative Time Dataset contracts remain refused.
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

## Human clarification and Manual Acceptance unblock

- Date: 2026-09-27.
- The Human reviewed the previously reported browser sequence and clarified
  that reversing the direction from the opposite Event's detail is an edit to
  the same Recorded Relation, not creation of a second conflicting Relation.
  The edit is allowed when it does not conflict with another independent
  assertion. Existing imported multiple Relations remain separate and are not
  merged or normalized.
- The earlier browser stop was therefore an incorrect expectation about that
  same-Relation replacement, not evidence that the service duplicated or
  retained both directions. Event Detail presentation was clarified to make
  Relation identity, per-record editing, and the separate add flow explicit.
- A regression now exercises the reported three-Event sequence, verifies that
  changing the `a`/`b` assertion from Event `b` preserves its Relation ID and
  the separate `b`/`c` Relation, and checks that imported same-pair claims are
  still independently listed. At the end of that checkpoint, real-browser
  acceptance had not yet been completed; the later History-aware acceptance
  result is recorded below.

## Verification and acceptance status at the initial checkpoint

- Focused service and UI integration tests: **12/12 PASS**.
- Full NarrativeLine test suite: **276/276 PASS**.
- NarrativeLine lint: **PASS**; production build: **PASS**.
- E2R-SPEC `npm run validate`: **PASS** after the minimal Roadmap sync.
- No real-browser acceptance was performed in this initial implementation
  checkpoint. The later History-aware browser acceptance is recorded below.

At the end of the initial implementation checkpoint, this record did not
claim Manual Acceptance, application release, or deployment. NarrativeLine
remains a local `0.2.0` candidate; Credits release date remains for the actual
deploy day. Relative Time `0.2.0` and History `2.0.0` remain Candidates. No
push, tag, release, or deploy was performed.

## History-aware Recorded authoring follow-on

- Date: 2026-09-27.
- Status: **IMPLEMENTED / AUTOMATED GREEN / REAL-BROWSER ACCEPTANCE PASS**.
- The user-facing Recorded assertion list, update controls, and new assertion
  form now accept any Event endpoint when the Dataset's Relative Time contract
  is safely authorable. History 1, History 2 circa, and legacy `date` fields
  no longer hide these controls or assertions. Newly added History does not
  hide an existing Recorded Relative Time Relation from Event Detail.
- The previous History-free/date-free eligibility rule is now explicitly a
  Timeline projection rule. Mixed and dated Relations remain outside the
  current display-only projection; History-free chain placement and the
  existing Timeline ordering are unchanged. No History/Relative Time
  consistency diagnosis, temporal bound, date, `temporalOrder`, or other
  Derived write-back was added.
- Automated regression coverage exercises History 1, History 2 circa, legacy
  date, dated-to-undated and dated-to-dated authoring, editing from both
  endpoints, History added after Relation creation, preservation of Relation
  identity/endpoints/payload and History data, and export/re-import for History
  1 and History 2. The Event Detail integration test confirms the controls are
  exposed for a History-bearing Event and keeps Relation IDs out of visible
  copy.
- Verification: focused Relative Time tests **20/20 PASS**; full test suite
  **284/284 PASS**; lint, production build, and `git diff --check` **PASS**.
- Real Browser Manual Acceptance: **PASS** on 2026-09-27 using Microsoft Edge
  with a dedicated temporary profile and the accepted local CDP helper. A
  locally prepared Dataset was opened through NarrativeLine's ordinary file
  input. Its History 1 ↔ undated and History 1 ↔ History 1 Recorded assertions
  appeared in Event Detail; a dated-to-dated direction update retained the same
  record row and Event endpoints, and the History year remained unchanged. A
  new dated-to-undated assertion was added and then found from the undated
  endpoint. Relation IDs were present only in the inspected DOM identity
  attribute, not in ordinary visible copy.
- The browser Timeline showed the three-Event History-free chain in the
  Relative Time projection; the History-bearing assertions remained absent
  from that projection. Existing History/date entries remained on the ordinary
  Timeline list. English and Japanese copy rendered, and the update/create
  feedback appeared within its corresponding Recorded/New details.
- At 921px, 600px, and 360px viewport widths, the inspected page had no
  horizontal overflow; at 360px, both Relative Time details were opened and
  their controls remained within the viewport. Tab and Shift+Tab exposed the
  visible focus outline. No blank screen, page `error` event, or unhandled
  rejection was observed. The CDP screenshot command timed out, so viewport
  layout evidence is based on the live browser UI and measured DOM geometry
  rather than a saved screenshot.
- Validator diagnostic follow-up: the earlier long-running local Vite session
  did display `specification_version_unsupported` at the Relative Time
  `0.2.0` declaration. Browser network evidence showed that this session's
  optimized Validator bundle recognized only Relative Time `0.1.0`. The
  installed package, lockfile, and current NarrativeLine dependency are all
  Validator `0.7.0`, whose source supports exact `0.2.0`. The same fixture
  produced no diagnostics when passed to that installed package, and opening
  it through the ordinary Import control in a fresh Vite session also showed
  no warning. The earlier warning was caused by stale local Vite optimized
  dependency state; it is not an expected Candidate warning and was not an
  import-presentation defect. No Validator, dependency, or application source
  change was needed.
- This browser pass covers the History-aware authoring follow-on. It does not
  by itself claim final milestone closure or replace the Human's final
  acceptance decision.
- Relative Time Candidate, History specification, and Validator were not
  changed. Same-pair create limits, Relation identity, independent assertion
  preservation, and no automatic inverse remain unchanged. This record does
  not claim final milestone closure or release.

## Closure audit (2026-09-27)

- Source review confirms Recorded authoring eligibility is based on the exact
  Relative Time declaration and a safely authorable Dataset contract; Event
  History/date is not an authoring filter. Timeline projection uses a separate
  History/date-free Event eligibility check. Tests directly cover History 1,
  History 2 circa, legacy date, mixed dated/undated and dated/dated authoring,
  later History addition, and exclusion of dated endpoints from projection.
- The existing browser record covers authoring and update behavior, English
  and Japanese presentation, visible identity boundaries, Timeline projection,
  and measured 921px, 600px, and 360px layouts. Browser Export → actual
  downloaded artifact → Re-import was confirmed in the earlier first-consumer
  acceptance record; History 1 / History 2 round-trip is also covered by the
  current automated service tests. No repeat browser round-trip was needed.
- The earlier `specification_version_unsupported` observation is classified as
  stale local Vite optimized-dependency state: installed and locked Validator
  `0.7.0` accepts Relative Time `0.2.0`, and a fresh Vite runtime showed no
  import warning. This remains operational evidence, not a Candidate warning.
- The E2R-SPEC Roadmap's initial implementation-stage “real-browser pending”
  status was marked as historical and superseded by the later History-aware
  acceptance result. The dirty Session 0094 and untracked `work/` were
  preserved. No specification, History, Validator, or application runtime
  behavior changed in this audit.
- Audit verification: NarrativeLine **284/284 tests PASS**, lint, production
  build, and `git diff --check` **PASS**; E2R-SPEC `npm run validate`
  **PASS**. Final milestone closure and release remain subject to Human's
  acceptance decision.
