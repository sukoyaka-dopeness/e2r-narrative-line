# Quantitative Relative Time user-facing milestone — implementation

Status: runtime implementation and automated verification complete; Human Browser Acceptance pending.

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

Automated coverage: `tests/QuantitativeRelativeTimeService.test.js` and
`tests/QuantitativeRelativeTimeIntegration.test.js`, plus existing NarrativeLine
tests. Human Browser Acceptance should check the two authoring forms, selected
Relation edit/delete, multiple separate date candidates, the History prefill
versus Save boundary, Timeline candidate labeling, and EN/JA narrow layout.
