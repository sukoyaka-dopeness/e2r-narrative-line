# NarrativeLine Relative Time 0.2.0 User-Facing Milestone Scope Preparation 1

- Date: 2026-09-26
- Status: **DESIGN PREPARATION COMPLETE / NO RUNTIME IMPLEMENTATION AUTHORIZED**

## Human direction recorded

The Human directed that the current NarrativeLine `0.2.0` local candidate not
be deployed yet. The intended first NarrativeLine release in which users can
actually use Relative Time should include both:

1. authoring/editing Relative Time information in NarrativeLine; and
2. meaningful Timeline ordering or placement for Events without a usable
   recorded date, based on recorded Relative Time.

The already accepted first-consumer scope A—exact-version read-only
recognition, generic diagnostics, and round-trip preservation—is the
foundation, not the user-facing endpoint. Relative Time `0.2.0` remains a
Candidate. This direction does not approve a vocabulary subset, editor, graph
projection, conflict policy, or runtime implementation. Those choices below
are preparation, not adopted design.

The NarrativeLine `0.2.0` version metadata and Pages workflow pin correction
remain local development baseline. The Credits release date remains unchanged
until the actual deployment day. No push, tag, release, or deploy is part of
this checkpoint. The earlier circa release/version observation is not a basis
for retroactively editing release history.

## Current evidence and authority

- NarrativeLine `main` is locally at `6a60e0b` (the `0.2.0` version candidate)
  above `6cbc3f1` (the E2R-SPEC Pages-workflow pin correction); public
  `origin/main` remains `3d98614`. Neither local commit is published.
- The accepted [scope A result](./relative-time-0.2.0-first-consumer-scope-a-result.md)
  closes exact-version read-only recognition, existing generic diagnostics,
  and browser-confirmed round-trip preservation. It explicitly excludes
  authoring and Relative-Time-driven Timeline ordering.
- E2R-SPEC's [Relative Time 0.2.0 Draft](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/extensions/relative-time-0.2.0-draft.md)
  and [atomic Recorded semantics adoption](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/temporal/relative-time-atomic-recorded-assertion-semantics-adoption1.md)
  govern their respective Candidate contract and adopted atomic meanings.
  The Draft defines five Features; only `relative-position` is a plausible
  starting point for simple qualitative earlier/later assertions.
  `same-instant` does not itself order Events. Containment, interval topology,
  calendar-granule
  relations, and elapsed offsets have distinct meanings and do not become
  simple list order by virtue of being in the same Extension.
- The Draft permits independent Relations for one Object pair, does not
  require mirror Relations, and does not define transitivity, conflict
  resolution, cycles, a solver, Timeline placement, or presentation order.
  `before`/`after` do not imply dates, elapsed days, duration, interval
  endpoints, or total order. Recorded Relative Time needs no History grounding.
- Published Validator `0.7.0` provides read-only exact-version structural
  validation. It does not evaluate assertion truth, compare with History,
  detect/resolve Relative Time conflicts, or compute Timeline order.
- Current NarrativeLine Timeline sorting uses supported History date/time,
  then applicable History `temporalOrder`, then Event ID. Relative Time is
  not read by the comparator. `SpecificationDeclarationService` does not
  currently own a Relative Time writer/declaration path. Scope A preserves
  Relative Time payloads opaquely on unrelated edits and export.
- Existing application and E2R-SPEC research on undated placement is
  exploratory/historical evidence, not a product or normative decision. It
  highlights partial-order incomparability, cycles/conflicts, dated anchors,
  and display-only ordering as questions; its candidate algorithms are not
  adopted here.

No application source, specification, schema, Validator, or Dataset was
changed for this preparation. Existing unrelated NarrativeLine dirty files
and E2R-SPEC's untracked `work/` were left untouched.

## Recommended bounded implementation target (proposal only)

Treat authoring and useful undated-Event placement as one user-facing
milestone and one eventual release-acceptance boundary. The implementation
may be delivered through sequential local checkpoints: first safe persisted
authoring and exact declaration handling, then the approved presentation
projection. Neither authoring-only nor read-only display-only should be
called completion of the Human's requested user-facing milestone.

The smallest candidate vocabulary is Event-to-Event `relative-position`
`before` / `after` only. Defer `same-instant`, `containment`,
`interval-topology`, `calendar-granule-relation`, and `elapsed-offset`; they
need different user language or do not directly express qualitative
earlier/later claims.
Do not infer semantics from Relation names or Core endpoint direction. The
UI must make clear that the target is described relative to the selected
source/reference Event.

For a first bounded slice, consider limiting both authoring and projection to
Events with no usable Civil Time and no existing History `temporalOrder`.
Keep current date ordering and History ordering unchanged; do not interleave
undated Events among dated anchors in this first slice. This deliberately
leaves dated/undated interleaving for a later decision, rather than implying
that History precision or Relative Time supplies an absolute position.

Any Timeline result must remain a derived presentation projection: do not
write ranks, dates, `temporalOrder`, inverse Relations, or inferred Relations
to the Dataset. A display tie-breaker is not a recorded temporal assertion.
The projection must not silently turn incomparable Events into asserted
chronology. The layout/label approach and the treatment of conflicting input
remain Human decisions below.

## Human decision packet

The following choices block a faithful implementation. Suggested defaults
are recommendations only.

### 1. What does the first Timeline projection show?

- **A — Pairwise-constraint presentation (recommended):** display recorded
  qualitative earlier/later assertions while visibly retaining incomparable Events as
  unordered. No ordinal numbers, inferred dates, duration-proportional
  spacing, or claim that every pair is ordered. This best protects the
  adopted boundary but needs a concrete, accessible presentation design.
- **B — Deterministic linear display:** choose one repeatable linear display
  consistent with supported direct constraints, using an explicit
  non-semantic tie-break for incomparable Events and bilingual disclosure
  that their relative chronology is not recorded. This is simpler for a
  conventional list but risks visually implying total order.
- **C — Defer Timeline rearrangement:** author and inspect pairwise
  assertions first, but do not count the user-facing milestone as complete
  until a later Timeline projection decision. This does not yet meet the
  stated user-facing goal.

Research-derived transitive edges must not be persisted. Whether a
presentation may use a transitive constraint path to place Events is not
resolved by the current Draft; if selected, explicitly authorize it as
application display behavior, not as a new Recorded assertion or Validator
rule.

### 2. Which Events may participate initially?

- **A — Undated-only, no `temporalOrder` (recommended):** qualitative
  earlier/later assertions among Events lacking a usable Civil Time and
  lacking History `temporalOrder`; preserve the existing dated and History
  sorting paths.
- **B — All undated Events:** include Events with `temporalOrder` and decide
  how Relative Time combines with that existing History comparison.
- **C — Mixed dated/undated anchors:** allow Relative Time edges to place an
  undated Event relative to dated Events. This requires additional rules for
  recorded granularity, partial dates, contradictions, and the existing
  date-first comparator; it is not the minimum slice.

The recommended A is intentionally narrower than general Event-to-Event
Relative Time support. It does not require History data and does not overload
`temporalOrder`.

### 3. How should cycles and contradictory recorded assertions behave?

The Dataset must remain preservable; no assertion is a winner merely because
it was entered later or is convenient for the Timeline. Choose whether the
application should (a) suppress projection for only the affected connected
group and show a localized diagnostic, (b) keep the existing stable display
for that group with a diagnostic, or (c) use another explicit safe behavior.
Also decide whether the editor prevents adding an immediately contradictory
edge while still preserving/importing existing conflicts. Validator `0.7.0`
does not supply this conflict policy for `0.2.0`.

### 4. What is the first authoring lifecycle?

Recommended initial boundary: create/edit one typed `relative-position`
assertion between two distinct Events; never auto-create the inverse Relation.
Human direction is needed on whether the editor may create more than one
assertion for an Event pair and how a user selects/edits one when independent
Relations already exist. Deletion, bulk editing, Entity endpoints, and
semantic Feature families beyond before/after can remain out of scope.

The app must declare exact Relative Time `0.2.0` and exactly the used Feature
set when it first writes such a payload. It must not silently convert a
Dataset declared at `0.1.0`, change an unsupported exact version, or claim an
incomplete Specification `uses` list. Decide whether authoring is unavailable
for those Datasets in this milestone (recommended) or whether a separate,
explicit user-directed upgrade workflow is desired later. No automatic or
implicit migration is proposed.

### 5. How should existing History influence eligibility?

Recommended initial behavior is no semantic comparison with History and no
History write. Decide whether partially dated/approximate History 2 Events
are excluded from the first Relative Time projection (recommended) or need a
separate eligibility rule. Do not equate missing display date with a known
temporal position, or use History `temporalOrder` as a substitute for
Relative Time.

## Not required for this milestone

- Relative Time Stable promotion or changing either immutable exact version.
- Any amendment to Core, History, Relative Time Draft/schema, or Validator.
- History grounding, endpoint truth evaluation, Derived write-back, solver,
  transitive closure as Dataset truth, winner selection, or automatic repair.
- Absolute dates, elapsed-day labels, ordinal-day claims, durations, or
  interval precision inferred from `before` / `after`.
- Dataset migration, conversion of `0.1.0`, application version/release,
  Credits date, push, tag, GitHub Release, or Pages deployment.

## Next checkpoint

Human should select or revise decisions 1–5 above. After those choices are
recorded, a separate implementation authorization can define acceptance
fixtures for authoring, exact declaration/Feature updates, edit/export
preservation, mixed/unsupported Dataset refusal, undated projection,
incomparability, conflict behavior, keyboard access, EN/JA, and narrow layout.
Until then the current `0.2.0` local candidate remains undeployed, and scope A
remains its only accepted Relative Time capability.
