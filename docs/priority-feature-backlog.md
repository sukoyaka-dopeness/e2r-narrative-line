# NarrativeLine Priority Feature Backlog

Status: Post-MVP product priorities recorded on 2026-08-13.

This document records requested NarrativeLine capabilities before their data
models are fixed. It is an application backlog, not an E2R specification. A
feature that affects interoperable meaning must pass through the appropriate
E2R research and Extension design process before NarrativeLine writes a shared
representation.

## Requested capabilities

### Object provenance and supporting sources

Users should be able to record which source or sources justify creating an
Object. The initial scope may include Entity, Event, and Relation, but the
design must decide whether provenance belongs to a whole Object, an individual
field, or a more granular factual claim.

This must remain distinct from confidence. Existing E2R AI workflow research
already separates provenance (where a value or Object came from) from evidence
(what supports a factual claim). Citation identity, embedded versus external
resources, source excerpts, and offline portability remain open questions.

Design discussion required: yes. This is a cross-application Extension or
research candidate rather than a new Core field.

### Object confidence

Users should be able to record confidence in an Object or supported claim.
Before choosing a field, the design must define whose confidence is recorded,
what the score applies to, the scale or vocabulary, whether explanation and
assessment time are needed, and how multiple assessments coexist.

Confidence must not be inferred from the number of sources and must not be
combined with provenance merely because both appear in an evidence-review UI.

Design discussion required: yes. A research draft should first compare
Object-level confidence, field-level confidence, and claim/evidence-level
assessment.

### Entity aliases

Entity Detail should support alternative names for display and search,
including language-specific names where appropriate.

Existing research distinguishes an alias from a human-readable reference code
and from an external identifier. The Dictionary Extension already provides
localized labels and anticipates synonyms, but it has not yet established that
an Entity alias should be stored directly on each Entity or resolved through a
Dictionary entry.

Design discussion required: yes, but a bounded NarrativeLine UI experiment may
follow once the temporary ownership and round-trip behavior are explicit.

### Event intervals and broad temporal ranges

NarrativeLine should represent Events such as a decade, a year-to-year range,
or a day-to-day range as temporal information about an Event. These are not
`era` Entities.

History Extension `1.0.0` preserves incomplete precision but explicitly
excludes time intervals and durations. A future design must distinguish at
least:

- one occurrence known only to broad precision, such as a decade;
- an Event extending from a start to an end;
- uncertainty about when an occurrence happened; and
- an open-ended or ongoing Event.

Design discussion required: yes. NarrativeLine must not encode these distinct
meanings as an application-defined pair of dates before the temporal model is
agreed.

### Ordering undated Events

Users should be able to control the relative temporal order of undated Events.
The first UI may use accessible move-up and move-down controls; drag and drop is
a later interaction enhancement.

History Extension `1.0.0` already permits a Time Object containing only
`temporalOrder` when relative chronology among undated Objects is known.
NarrativeLine already reads this field when sorting. The next implementation
step is a writer UI that updates order without inventing dates or reversing
known chronological values.

Design discussion required: no for temporal ordering among undated Events. If
the requested order is editorial or narrative rather than temporal, it belongs
to the separately deferred persisted authorial-context responsibility and must
not be written to `temporalOrder`.

## Recommended discussion split

ChatGPT is useful for bounded design drafts covering:

1. provenance, evidence, and confidence granularity;
2. Entity alias ownership versus Dictionary integration; and
3. Event interval, broad precision, uncertainty, and duration semantics.

Each draft should receive a focused handoff containing the current Core,
History, Dictionary, AI workflow research, and relevant naming/versioning
decisions. Codex should then audit the draft against the source repository,
record accepted research conclusions, and implement only the selected bounded
experiment.

The undated Event ordering UI does not need a separate ChatGPT design round for
its first temporal-order implementation because the persisted field and its
constraints already exist.

## Suggested implementation sequence

1. Add accessible ordering controls for undated Events using
   `extensions.history.time.temporalOrder`.
2. Prepare and audit the three focused design drafts above.
3. Select one bounded alias or evidence experiment after its ownership is
   clear.
4. Extend the History model only after interval semantics have been agreed at
   specification level.
5. Add drag-and-drop ordering after the non-pointer controls and persistence
   behavior are stable.
