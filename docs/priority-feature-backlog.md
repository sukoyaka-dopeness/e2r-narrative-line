# NarrativeLine Priority Feature Backlog

Status: Post-MVP product priorities recorded on 2026-08-13.

This document records requested NarrativeLine capabilities before their data
models are fixed. It is an application backlog, not an E2R specification. A
feature that affects interoperable meaning must pass through the appropriate
E2R research and Extension design process before NarrativeLine writes a shared
representation.

## Current baseline and research status

- Coordinate interoperability interpretation and bounded Entity position
  editing are implemented. `liaisonscape-graph` is the canonical current
  profile identifier; `linkscape-graph` remains a legacy compatibility
  identifier.
- Basic History date/time editing and Timeline time display are implemented.
- Target Reference and Source/Citation work currently provides opaque
  preservation evidence, not product semantic support or user-facing editing.
- P1 Names work provides bounded consumer research evidence only. Names
  product integration, alias semantics, and shared representation remain
  unresolved.

The remaining sections describe unfinished product or specification work.

## Requested capabilities

### Source/Citation and Object provenance

Users should be able to record which identified Source is cited in connection
with an Event or other supported target. The Gate 3 research baseline is an
identified Source plus a weak Citation association to the identified target.
This association does not imply evidential support, derivation, authorship,
truth, reliability, or confidence.

This is distinct from Provenance. A separate workflow may record that an
import, person, application, or Source caused an Object record to be created or
changed. A Citation must not silently become Provenance.

The initial NarrativeLine scope is a research and preservation concern only.
It must not write a shared representation until the responsible Extension
boundary and payload are selected.

This must remain distinct from confidence. Existing E2R AI workflow research
already separates provenance (where a value or Object came from) from evidence
(what supports a factual claim). The current Gate 3 review also keeps weak
Citation separate from Evidence and Claim. Source identity, Citation identity,
embedded versus external resources, source excerpts, and offline portability
remain open questions.

Design discussion required: responsibility comparison completed; final
cross-application Extension and payload design remains gated. This is not a new
Core field.

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

Users should be able to control relative chronology involving Events without a
recorded date. Two requirements must be kept distinct:

- ordering undated Events relative to other undated Events; and
- placing an undated Event between dated Events when that chronological
  relationship is known, for example year `n`, undated, year `n+1`.

History Extension `1.0.0` already permits a Time Object containing only
`temporalOrder` when relative chronology among undated Objects is known.
NarrativeLine already reads this field when sorting. However, the recommended
History comparison places known Civil Time before unknown Civil Time, and
History `1.0.0` explicitly excludes relative before/after/between relationships
among Events. `temporalOrder` therefore must not be assumed to encode the
second requirement without a specification decision.

Existing read-only use of `temporalOrder` is not a new product feature. A
persisted writer for ordering undated Events may be considered within the
existing History constraints, but design discussion is required before
persisting interleaving with dated Events. If the requested order is editorial
or narrative rather than temporal, it belongs to the separately deferred
persisted authorial-context responsibility and must not be written to
`temporalOrder`. Accessible move controls should precede drag and drop once the
correct persisted responsibility is selected.

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

1. Resolve whether relative chronology between dated and undated Events needs
   a Relative Time model before implementing a persisted ordering UI.
2. Prepare and audit the focused design drafts above.
3. Add accessible move controls for the selected temporal model before drag
   and drop.
4. Select one bounded alias or evidence experiment after its ownership is
   clear.
5. Extend the History model only after interval semantics have been agreed at
   specification level.
6. Add drag-and-drop ordering after the non-pointer controls and persistence
   behavior are stable.
