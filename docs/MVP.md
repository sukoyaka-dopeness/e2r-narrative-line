# NarrativeLine MVP

## Purpose

NarrativeLine is the first reference application built on top of E2R.

Its primary goal is to validate the practical usability of the E2R Core and the History Extension through real-world editing workflows.

The MVP intentionally focuses on simplicity.

Features that are not required for validating the Core data model are postponed until later versions.

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

Every newly created dataset should automatically receive a unique identifier.

The identifier is stored in `metadata.datasetId`.

An implementation may generate this identifier using `crypto.randomUUID()` or an equivalent mechanism.

The identifier remains stable for the lifetime of the dataset and is preserved during normal editing.

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

- Open the onboarding sample dataset.
- Create a new empty dataset.

The onboarding dataset exists solely to demonstrate the application.

---

## Create Event

Users create Events directly from Timeline View.

Workflow:

Timeline View

↓

New Event

↓

Event Detail

↓

Save

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

## Time Editing

Time is edited using separate fields.

Date fields:

- Year
- Month
- Day

Time fields:

- Hour
- Minute
- Second

The time fields may initially be hidden inside a collapsible section.

Unknown values are omitted from the dataset.

---

## Timeline Ordering

Events are ordered using:

1. Temporal value
2. Temporal precision (coarser precision first)
3. Order
4. Event id

For example:

1945

1945-08

1945-08-15

1945-08-15 12:00

1945-08-15 12:00:30

Events without temporal information appear after dated Events.

Future versions may additionally support Relative Time and causal ordering.

---

# Saving

When saving:

- Order values may be regenerated.
- Existing dataset structure should be preserved whenever possible.
- Unsupported Extensions should be preserved whenever possible.

When loading:

- Dataset validity is checked.
- Unsupported Extensions are ignored without failing.

---

# E2R Support

NarrativeLine supports:

- E2R Core
- History Extension

Other Extensions remain untouched unless explicitly supported by future versions.

---

# User Interface

The MVP consists of the following primary views.

- Timeline View
- Event Detail
- Entity Picker
- Dataset Settings

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
