# Quantitative Relative Time user-facing milestone — implementation

Status: **Human Browser Acceptance PASS / ACCEPTED / CLOSED** (2026-09-30).

This milestone adds Event-to-Event authoring for the exact Relative Time `0.2.0`
Candidate Features `calendar-granule-relation` and `elapsed-offset`. Event Detail
creates one Recorded Relation per action and edits or deletes one selected
Relation. It preserves independent imported Relations and unknown sibling
properties on edits. A Relation with another Extension payload is not deleted
through this UI. Initial authoring permits one assertion of each quantitative
Feature per Event pair; it does not introduce general-purpose multiple-
assertion authoring.

Calendar displacement remains granule membership, including zero and negative
integer displacement. Elapsed offset remains a positive integer count of
seconds, minutes, or hours with an explicit before/after direction. The UI
does not convert months or years to elapsed days. Quantitative and qualitative
Relations can coexist; neither is inferred from or merged with the other.

For each directly connected Relation, the application may calculate one
supplementary date candidate from a recorded History position on the opposite
Event. It supports either Relation direction, preserves separate candidates
and Relation identity, and does not follow chains or select a winner. Calendar
results have the precision of the selected granule; missing anchor fields are
never filled. Elapsed results require anchor precision at least as fine as
the selected unit. The calculation uses proleptic Gregorian civil fields and
does not evaluate time zones or DST. Unsupported calendars, approximate or
non-single History positions, insufficient precision, and values outside the
calculation range do not produce a computed date candidate. Candidate copy
explicitly marks these values as unrecorded and warns that time zone/DST are
not evaluated.

Timeline keeps its Recorded History position and adds a distinct candidate
hint to the Event card. Event Detail lists each candidate and its direct
Relation/anchor. Choosing an eligible candidate fills the History editor only;
ordinary Save is required to record History. The Relation remains. The button
is unavailable where the existing History editor cannot safely accept the
value, including coarsening an existing recorded position or replacing a
zoned History value. An exact History `2.0.0` Dataset uses its existing
single-position writer when the candidate is saved into an undated Event.
No Derived value is persisted.

Relative Time OFF/ON/DIAGNOSTIC remains Dataset-evidence based. Valid supported
quantitative records derive ON; unsupported or partially recognized evidence
remains DIAGNOSTIC. Authoring retains the exact-version and complete-declaration
safety checks, while manual visibility remains session-only. Deleting the last
supported record leaves the tools visible in the active session; reopening
derives visibility from the exported Dataset.

No Relative Time Candidate, History, Perspective, Core, schema, or Validator
contract was changed. This implementation does not add Citation, Relation
graph editing, cross-feature diagnostics, transitive inference, a solver,
automatic History repair, or a portable UI preference.

Automated coverage: `tests/QuantitativeRelativeTimeService.test.js`,
`tests/QuantitativeRelativeTimeIntegration.test.js`,
`tests/QuantitativeRelativeTimeAcceptanceFixture.test.js`, and existing
NarrativeLine tests. At `8c76ecb64aa7239b6419ecbf483e7f922d58817f`,
344/344 tests, lint, build, and diff check passed. The fixture verifies
separate direct candidates, both Relation directions, calendar versus elapsed
wording, month precision, same-name chronology and short-ID fallback, and
Recorded Timeline placement. Integration coverage verifies that disclosure
does not change selection or Dataset content; candidate prefill does not save
History; discard leaves History unchanged; ordinary Save records History while
retaining the Relation; later Relation edit/delete does not repair saved
History. The candidate service remains direct one-hop with no winner selection.

## Human Browser Acceptance checkpoint

Human review accepted the Timeline candidate disclosure hierarchy and basic
interaction, candidate disclosure versus Event selection, and disclosure
versus card-wide drag hit areas. Human reviewed JA/EN at ordinary and narrow
widths, long and same-name Events including chronology/short-ID hints, one
and multiple candidates, wording from both Relation endpoints, calendar
versus elapsed meaning, and month-granule precision. Human also confirmed that
calendar-granule displacement remains distinct from elapsed duration and that
month-granule candidates retain their precision.

The refinement at `8c76ecb` compacted the Timeline candidate's internal
value/basis/warning spacing while retaining separation between candidates,
and aligned Event Detail date/time inputs with its ordinary QRT controls.
Human subsequently reported two Event Detail inconsistencies: the Name input
appeared shorter than peer controls, and the Gregorian Calendar label appeared
too close to the Name field. The bounded follow-up at `55f8d2c` aligned the
Event Detail Name input with the same control density and separated the Name
field from the calendar group without changing the calendar label-to-date
relationship or narrow layout rules. Human Browser Acceptance explicitly
passed the Name input geometry, Name-to-calendar spacing, and calendar
label/date grouping after this follow-up.

Human's final Timeline visual review explicitly passed the last Candidate
spacing refinement: for multiple expanded Candidates, each date and basis
reads as one unit, Candidates remain distinct, and the unrecorded/time-zone/
daylight-saving warning remains identifiable without the compact spacing
collapsing the information. Together with the earlier JA/EN, ordinary/narrow,
long-name, same-name, chronology, short-ID, interaction, direction, and
precision checks, all Human Browser Acceptance items for this bounded QRT
milestone are **PASS / ACCEPTED / CLOSED**. This records Human acceptance; it
does not expand or revise the Relative Time, History, or Perspective contracts.

Reusable NarrativeLine presentation direction from this review: Timeline
supplementary disclosures sit below the Event's primary content; peer
secondary disclosures share a visual hierarchy; a candidate's value, basis,
and warning read as one compact unit while separate candidates remain
distinct; peer ordinary editing inputs and selects on one surface share
natural geometry. New features should reuse accepted NarrativeLine ordinary
control density. Exact CSS values are implementation details, not a portable
design contract or E2R-wide/Cross-App visual rule. Cross-App Visual Style /
Flatness remains a separate workstream.

The next checkpoint is the NarrativeLine current-state/documentation/final
release-readiness audit. It must assess current release scope and obtain any
required Human decision before release execution; this QRT closure does not
authorize a release, deployment, or new showcase sample.
