# Perspective 0.1.0 Timeline Ordering — Implementation Candidate

Status: automated implementation candidate; Real Browser / Human Acceptance pending.

Authority: [E2R-SPEC Perspective `0.1.0` Candidate](../../e2r-spec/extensions/perspective-extension-candidate.md).

## Implemented boundary

The ordinary Timeline first derives its previous History-based order. For
eligible undated Relative Time groups, Derived band order permutes only the
group's existing display slots; disconnected groups and unrelated Events keep
their default slots. A supported, single Perspective then permutes only the
slots occupied by its listed Event IDs. Unlisted Events retain their
Derived/default slots and remain unplaced. A cyclic Relative Time group still
uses the accepted supplementary conflict treatment and contributes no band
ordering to the ordinary Timeline.

Each Event has native buttons to move one display position up or down. The
buttons can be reached and activated by keyboard, announce the Event and
direction, and report the result in a status message. A move adds the moved
Event and the crossed adjacent Event to the authored sequence. Existing
placed IDs retain their authored order unless crossed by the explicit move;
unaffected unplaced Events are not written to Perspective. Repeated moves can
place an undated Event between dated Events or move a band member elsewhere
in the display without changing temporal records or the Core Event array.
Drag and drop is not included.

The first move on a Dataset without Perspective creates one Dataset-level
`draft.github.sukoyaka-dopeness.perspective` `0.1.0` payload and an exact
Specification Extension use declaration when every already-used Extension
can be declared safely. Imported exact `0.1.0` data is consumed only with a
complete declaration and supported payload shape. With multiple applicable
Perspectives, Timeline uses Derived/default order and pauses authoring rather
than choosing an implicit default. Unsupported or malformed payloads are
preserved, and ordering writes are refused. No picker or manager was added.

Event add leaves the new Event unplaced; rename keeps placement by ID. Event
deletion removes its ID from every supported Perspective sequence within the
same Dataset mutation. Deletion is refused when an unsupported Perspective
payload cannot be safely updated. Imported dangling IDs are diagnosed and
preserved through unrelated edits and round-trips. History and Relative Time
changes do not rewrite the authored sequence. Dated and Derived-band order
mismatches are read-only diagnostics; warning acknowledgment is not serialized.

Perspective mutations use App's existing Dataset state, accepted baseline,
replacement guard, local persistence, and export/import path. Opening,
projection, and diagnosis are read-only and do not mark the Dataset modified.
Export does not normalize the sequence. The existing export operation remains
available when a mismatch warning is visible; this candidate does not add a
separate confirmation transaction.

## Responsibility and limits

`PerspectiveOrderingService` owns exact-version recognition, default display
composition, sparse sequence mutation, and diagnostics. `TimelineScreen` owns
controls and messages. App applies Dataset results. EventService performs
atomic Event/Perspective deletion cleanup. SpecificationDeclarationService
keeps exact declarations complete when the first stable History payload is
added or the last payload is removed by Event deletion. No Core, History,
Relative Time, E2R-SPEC, Validator, public sample, or other application source
was changed for this implementation.

The Timeline's native controls and status messages require Real Browser and
Human review for visual density, mobile layout, focus behavior, warning
comprehension, and the practical cost of repeated adjacent moves. That review
is the next acceptance checkpoint; automated gates do not constitute Human
acceptance.
