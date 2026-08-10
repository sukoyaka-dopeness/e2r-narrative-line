# NarrativeLine MVP

## Purpose

NarrativeLine is the first reference application built on top of E2R.

Its primary goal is to validate the practical usability of the E2R Core and the History Extension through real-world editing workflows.

The MVP intentionally focuses on simplicity.

Features that are not required for validating the Core data model are postponed until later versions.

## Acceptance Status

The NarrativeLine MVP was accepted as complete on 2026-08-06.

The implemented Core Dataset workflow, History date-only editing, Event and
Entity editing, Import and Export, validation, confirmation interactions, and
documented manual acceptance checks satisfy the current MVP scope.

Deferred features and subsequent UI polish are post-MVP work and do not block
or revoke this acceptance status.

---

# Goals

The MVP aims to demonstrate that users can:

- Create an E2R dataset.
- Edit Events.
- Associate Entities with Events.
- Visualize Events on a timeline.
- Save and load E2R datasets.
- Exchange datasets with other E2R applications.
---

# Dataset Identity

Every Dataset created by NarrativeLine receives a unique identifier.

The Dataset uses the top-level Core `version` and stores its identifier in
`extensions.metadata.datasetId`.

NarrativeLine generates this identifier as a UUID v7.

The identifier remains stable for the lifetime of the Dataset and is preserved
during normal editing and ordinary export or save-as operations.

The Metadata Extension and `datasetId` are optional in E2R. A Dataset imported
without either remains valid, and opening or importing it does not by itself
assign an identifier. NarrativeLine-created Datasets always receive one.

The optional `extensions.metadata.title` is omitted during Dataset creation
until a user assigns a title. A displayed placeholder is not stored as Dataset
metadata.

This identifier is intended to support future features such as:

- dataset identity
- version management
- branching
- federation
- peer-to-peer synchronization
- deterministic generation

These features are outside the scope of the MVP.

The MVP is only responsible for generating and preserving the identifier.

---

# Out of Scope

The MVP intentionally excludes:

- Relative temporal relationships
- Timeline branching
- Multiple timeline views
- Timeline lanes
- Timeline filtering
- Timeline search
- Entity-to-Entity Relation editing
- Graph visualization
- Collaboration
- Cloud synchronization
- Extension editing beyond History

---

# User Workflow

## Start

Users can either:

- Create a new empty dataset.
- Import an E2R JSON dataset.
- Open the onboarding sample dataset.

The onboarding dataset exists solely to demonstrate the application.

---

## Create Event

Users create Events directly from Timeline View.

Workflow:

Timeline View

↓

Add Event

↓

Event Detail

↓

Save Event

↓

Timeline View automatically scrolls to the newly created Event and moves keyboard focus to it.

---

## Edit Event

Each Event contains editable fields including:

- name
- description
- time

Entity association is optional.

When an Entity is associated with an Event, the required Relation is automatically created.

---

## Date Editing

Event date information is stored in `extensions.history.time` and edited using
separate fields.

Date fields:

- Year
- Month
- Day

Date precision may stop at year, month, or day. Unknown finer fields are omitted
and are not filled automatically. Year uses astronomical year numbering and may
be zero or negative.

NarrativeLine validates Gregorian month lengths and leap years before applying
an edited date. An Event without recorded date information does not contain an
empty Time Object.

## Clock and Time Zone Editing (Deferred)

Time fields:

- Hour
- Minute
- Second

These fields and their collapsible editing section are not yet implemented.

Unknown values are omitted from the dataset.

---

## Timeline Ordering

Events are ordered using:

1. Stored Civil Time date fields
2. Temporal precision (coarser precision first)
3. `temporalOrder` when recorded date fields cannot distinguish Events
4. Event id

For example:

1945

1945-08

1945-08-15

Events without temporal information appear after dated Events.

Future versions may additionally support Relative Time and causal ordering.

---

# Saving

When saving:

- `temporalOrder` is not generated merely to reproduce presentation order.
- Existing dataset structure should be preserved whenever possible.
- Unsupported Extensions should be preserved whenever possible.

When loading:

- Dataset validity is checked.
- Unsupported Extensions are ignored without failing.

---

# E2R Support

NarrativeLine currently supports:

- E2R Core
- History Extension date-only representation

History clock, Time Zone, offset, and Instant-related operations remain
deferred.

Other Extensions remain untouched unless explicitly supported by future versions.

---

# User Interface

The current implementation consists of the following primary views.

- Home
- Timeline View
- Event Detail
- Entity Picker
- Entity Create
- Entity Detail

Additional views may be introduced in later versions.

---

# Future Versions

Future releases may introduce:

- Relative Time
- Timeline filtering
- Timeline search
- Timeline lanes
- Multiple timeline views
- Calendar support
- Approximate time
- Era support
- Timeline navigation improvements
- Entity-to-Entity Relation editing
- Integration with Relationship Graph

---

# Relationship to E2R

NarrativeLine is a reference application for E2R.

Its purpose is not only to edit E2R datasets but also to validate the specification itself.

Practical implementation provides continuous feedback to E2R, helping identify opportunities to simplify the Core, improve Extensions, and clarify application responsibilities.

## Current MVP Scope

The current MVP focuses on validating the core editing workflow of E2R datasets.

### Included

- Home screen
- Create a new empty Dataset
- Generate and preserve a UUID v7 Dataset ID
- Open the onboarding sample Dataset
- Import and validate an E2R JSON Dataset from Home
- Export a validated Dataset as E2R JSON from Timeline
- Timeline screen
- Event selection
- Add Event
- Event editing
- Delete Event
- Confirm Event deletion before applying it
- Modal confirmation keyboard handling and focus containment
- History Extension date-only editing
- Year, month, and day precision
- Astronomical year numbering
- Gregorian date and leap-year validation
- History-based Timeline display and ordering
- Entity detail screen
- Entity editing
- Entity deletion with connected Relation cleanup
- Entity Picker
- Preserve valid Event edits before opening Entity Picker
- Discard a newly created Event when it is canceled before its first save
- Select an existing Entity for an Event
- Open Entity Create from Entity Picker and create a new Entity there
- Remove an Entity association from an Event
- Automatic Event-to-Entity Relation generation
- Preserve existing Relations and avoid generating duplicate structural Relations
- Relation-based lookup in either direction
- UI-independent Core Dataset validation with stable error codes and paths
- Preserve omitted optional Event fields when they have not been edited
- Navigation between Home, Timeline, Event Detail, Entity Picker, Entity Create,
  and Entity Detail
- In-memory dataset editing

### Deferred

The following features are not yet implemented in the current MVP build. Some
remain part of the target MVP, while others are deferred to later versions.

- Direct Relation editing
- History clock and Time Zone editing
- Other Extension editing
- Search
- Filtering
- Undo/Redo
- Multiple datasets
- History stack navigation
- Dataset Settings
- Japanese and English UI switching

## UI Principles

The MVP intentionally separates selection and editing.

- Selecting an Event highlights it in the Timeline.
- Editing is started explicitly by pressing the Edit button.
- Detail screens are editing screens rather than read-only viewers.
- Choosing Back in an existing Event Detail discards only unsaved local edits.
- Choosing Back in a new Event Detail before its first save removes the draft Event.
- Navigation should preserve editing context whenever possible.

Target navigation flow:

Home → Timeline → Event Detail → Entity Picker → Entity Create
                              ↘ Entity Detail

Back navigation is expected to return to the previous editing context rather than always returning to the Timeline.

## Future Direction

NarrativeLine is intended to become the reference implementation of E2R Studio.

Future capabilities include:

- Complete E2R editing
- Relation management
- Extension management
- Dataset validation
- Multiple datasets
- Local JSON editing
- LLM-assisted editing
- Visualization applications built on the same E2R dataset
