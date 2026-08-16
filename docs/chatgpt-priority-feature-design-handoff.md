# NarrativeLine Priority Feature Design Handoff

Status: non-normative design handoff. Completed checkpoints are recorded for
context; unresolved items remain subject to separate specification, research,
and product decisions.

The current product is LiaisonScape. Historical or persisted identifiers such
as `linkscape-graph` and `linkscape-user-unit` may remain where compatibility
requires them and must not be silently renamed.

This document explains why the priority design work began, what has since been
completed, and which questions a future ChatGPT or Codex session must resolve.
It is not the E2R specification, a Stable Extension definition, or an
authorization to implement unresolved features. The current backlog is
maintained separately in `docs/priority-feature-backlog.md`.

## Original design problem

The initial request concerned a Timeline with undated Events whose relative
chronology may be known among dated Events. The central question was whether
History `temporalOrder` could represent that meaning without inventing dates or
turning presentation order into temporal truth.

The handoff also examined provenance, evidence, Source/Citation, confidence,
Entity aliases, broad and interval temporal expressions, and the boundary
between interoperable data meaning and application-only UI. It required
comparison of application-only ordering, History changes, a future Relative
Time responsibility, and persisted authorial ordering while preserving unknown
fields and Extensions and keeping E2R Core minimal.

## Completed implementation context

The following work is now implemented and checkpointed in NarrativeLine:

- Coordinate interoperability is supported as a bounded application profile.
  `liaisonscape-graph` is the canonical current profile identifier and
  `linkscape-graph` remains a legacy compatibility identifier.
- Entity and Event Coordinate interpretation, Space selection, preservation
  of unsupported data, and bounded Entity `x`/`y` editing are implemented.
- Basic History date/time editing is implemented with contiguous precision
  rules for year, month, day, hour, minute, and second.
- Timeline cards display recorded time according to precision; this is not a
  Relative Time solution.
- Home action alignment and current Home UX have been completed.

These facts are implementation evidence, not a reason to expand the E2R Core
or declare an unregistered format a Stable Extension.

## Preservation and research evidence

Later checkpoints provide evidence at narrower boundaries:

- Target Reference fixtures demonstrate opaque preservation and round-trip
  behavior. They do not establish Target Reference product semantics or UI.
- Source/Citation fixtures demonstrate opaque preservation and conceptual
  round-trip behavior. They do not establish Citation as Evidence, Provenance,
  Claim, or a user-facing Source/Citation feature.
- P1 Names consumer experiments establish bounded exact-value discovery and
  lifecycle evidence. They do not authorize Names product integration, alias
  semantics, ranking, normalization, equivalence, or Grouping behavior.

Preservation is not semantic support. Research evidence is not a product
contract.

## Unresolved design questions

### Relative chronology

Before implementing a writer for interleaving undated Events among dated
Events, determine whether the specification needs a Relative Time
responsibility or a History-vNext change. Define before/after/between
relationships, cycles and conflicts, reproducibility across applications,
migration, and unknown-Extension behavior. Existing `temporalOrder` must not be
silently extended beyond its documented meaning. A temporary or read-only UI
is preferable to writing misleading data while this decision is open.

### Event temporal expressions

Distinguish broad precision such as a decade, an Event with a start and end,
approximate or uncertain time, duration, and an open-ended Event. These meanings
must not be represented as an application-defined pair of dates or as an `era`
Entity. History-vNext, a separate temporal Extension, or multiple
responsibilities remain possible and require specification comparison.

### Source, Citation, evidence, and confidence

Keep separate where an Object or value came from, what supports a factual
claim, Source/Citation identity, external identity, and confidence or
assessment. Before UI, decide Extension ownership, Object/field/claim
granularity, offline representation, multiple assessments, and unknown-data
preservation.

### Names and aliases

P1 research does not settle whether alternative names belong directly on an
Entity, in Dictionary-backed labels, or elsewhere. Future design must address
language/script, preferred versus alternative labels, duplicate values, search,
external identifiers, round-trip behavior, and the distinction between a name
expression and Core Entity identity. Do not treat the P1 experiment as an alias
standard or begin product integration without an ownership decision.

## Next decision sequence

The first unresolved blocker is ownership of chronology between dated and
undated Events. Resolve that before adding a persisted ordering UI. Temporal
expressions, Source/Citation, confidence, and Names can be researched in
parallel, but each requires a clear Extension or application boundary before
implementation.

After a responsibility is selected, obtain cross-application evidence with
canonical fixtures, validate unknown-field and unknown-Extension preservation,
define conflict and migration behavior, and only then authorize a bounded
NarrativeLine experiment. Accessible non-pointer controls should precede
drag-and-drop interaction for any future ordering editor.

## Constraints for the next session

- Keep E2R Core minimal and preserve Dataset self-containment.
- Do not treat presentation order as temporal truth or invent absolute dates.
- Do not use Relation-to-Relation endpoints.
- Keep provenance, evidence, Citation, confidence, identity, and aliases
  distinct unless specification decisions prove otherwise.
- Preserve unknown fields and Extensions.
- Mark provisional JSON and Extension names as non-normative.
- Do not infer product authorization from preservation or research checkpoints.

This handoff records the completed implementation and evidence baseline so the
next design session can focus on unresolved ownership and interoperability
decisions without reopening settled checkpoints or overstating research.
