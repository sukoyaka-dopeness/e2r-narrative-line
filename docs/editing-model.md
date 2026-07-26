# NarrativeLine Editing Model

## Purpose

This document describes how NarrativeLine edits E2R datasets.

It defines the behavior of dataset modification independently from the user interface.

Visual presentation and interaction design are described separately in `ui-spec.md`.

---

# Design Principles

NarrativeLine follows these principles:

- Modify as little data as possible.
- Preserve existing datasets whenever possible.
- Edit only information the application understands.
- Generate derived structures automatically whenever practical.
- Keep the E2R Dataset internally consistent.

---

# Editing Unit

The primary editing unit is an Event.

Users edit Events directly.

Entities and Relations are updated automatically when required.

---

# Event Creation

Creating an Event performs the following operations:

1. Create a new Event.
2. Assign a unique identifier.
3. Insert the Event into the dataset.
4. Recalculate timeline ordering if necessary.

No Entity association is required.

---

# Event Modification

Users may edit:

- name
- description
- temporal information

Changes are immediately reflected in the in-memory dataset.

Timeline ordering is updated automatically whenever temporal information changes.

---

# Entity Association

An Event may reference zero or more Entities.

When an Entity is associated with an Event:

- the Entity is linked to the Event
- the required Relation is created automatically

If the Entity already exists, it is reused.

If a new Entity is created, it is added to the dataset before the Relation is generated.

The user does not edit these Relations directly in the MVP.

---

# Event Deletion

Deleting an Event removes:

- the Event
- Relations connected to the Event

Associated Entities remain unless explicitly removed.

---

# Timeline Ordering

Timeline ordering is determined using:

1. Temporal value
2. Temporal precision
3. Order
4. Event id

The application may regenerate Order values whenever relative ordering is preserved.

---

# Dataset Loading

Loading a dataset performs the following steps:

1. Parse JSON.
2. Validate the Core structure.
3. Validate supported Extensions.
4. Preserve unsupported Extensions whenever possible.
5. Build the internal editing model.

Datasets remain editable even if unsupported Extensions are present.

---

# Dataset Saving

Saving a dataset performs the following steps:

1. Validate the in-memory dataset.
2. Regenerate Order values if necessary.
3. Preserve unsupported Extensions whenever possible.
4. Serialize the dataset as JSON.

Saving should modify the original dataset as little as possible.

Formatting differences that are unrelated to editing should be minimized whenever practical.

---

# Extension Handling

NarrativeLine supports:

- E2R Core
- History Extension

Unsupported Extensions:

- remain attached to their original objects whenever possible
- are not interpreted
- are not modified intentionally

NarrativeLine edits only the Extensions it understands.

---

# Validation

The application validates:

- required Core fields
- identifier uniqueness
- supported History Extension fields

Validation failures should not automatically discard user data.

Errors should be reported without unnecessary data loss.

---

# Internal Consistency

The application is responsible for maintaining a consistent dataset.

Examples include:

- removing orphaned Relations
- generating required Relations
- maintaining valid Event references
- maintaining timeline ordering

Applications may generate derived values internally, but these values must not become independent sources of truth.

---

# Future Editing Capabilities

Future versions may introduce:

- Undo / Redo
- Batch editing
- Relative Time editing
- Entity-to-Entity Relation editing
- Automatic merge support
- Conflict resolution
- Incremental validation
- Extension plug-in support
