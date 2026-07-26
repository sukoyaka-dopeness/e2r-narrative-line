# NarrativeLine UI Specification

## Purpose

This document describes the user interface behavior of NarrativeLine.

It defines user workflows and interaction rules independently from visual design.

Screen layouts, colors, typography, and other visual details are intentionally outside the scope of this document.

---

# Design Principles

The user interface should:

- Keep timeline editing simple.
- Minimize the number of required operations.
- Keep users focused on Events.
- Generate E2R structures automatically whenever possible.
- Preserve existing datasets whenever possible.

---

# Primary Views

The MVP consists of four primary views.

- Timeline View
- Event Detail
- Entity Picker
- Dataset Settings

---

# Application Flow

Users can begin by:

- Opening the onboarding dataset.
- Creating a new empty dataset.
- Opening an existing dataset.

---

# Timeline View

Timeline View is the primary screen.

It displays Events in chronological order.

Users can:

- Create an Event.
- Select an Event.
- Delete an Event.
- Open Dataset Settings.
- Save the dataset.
- Load a dataset.

Timeline View does not edit Event details directly.

---

# Event Detail

Event Detail is used to edit a single Event.

Editable fields include:

- Name
- Description
- Time
- Associated Entities

Changes are applied immediately to the in-memory dataset.

Saving the dataset is a separate operation.

---

# Time Editor

Time is edited using independent fields.

Visible by default:

- Year
- Month
- Day

Additional fields:

- Hour
- Minute
- Second

Time fields may initially be hidden inside a collapsible section.

Unknown values are omitted from the dataset.

---

# Entity Picker

Users may associate zero or more Entities with an Event.

Entity association is optional.

Selecting an existing Entity creates the necessary Relation automatically.

Creating a new Entity from the picker is permitted.

Entity-to-Entity Relation editing is outside the MVP.

---

# Creating an Event

The workflow is:

Timeline View

↓

New Event

↓

Event Detail

↓

Save Event

↓

Timeline View

↓

Automatically scroll to the newly created Event

↓

Move keyboard focus to the new Event

---

# Editing an Event

Selecting an Event opens Event Detail.

Changes are reflected immediately.

Timeline ordering updates automatically when temporal information changes.

---

# Deleting an Event

Deleting an Event removes:

- the Event itself
- Relations connected to the Event

Associated Entities remain unless explicitly removed.

---

# Timeline Ordering

Timeline View displays Events using:

1. Temporal value
2. Temporal precision (coarser precision first)
3. Order
4. Event id

Events without temporal information appear after dated Events in the MVP.

---

# Saving

Saving writes the current dataset to JSON.

During saving:

- Order values may be regenerated.
- Unknown Extensions should be preserved whenever possible.
- Dataset structure should change as little as possible.

---

# Loading

Loading replaces the current dataset.

During loading:

- Dataset validity is verified.
- Unsupported Extensions are ignored.
- Unknown Extensions are preserved whenever possible.

---

# Error Handling

The application should display clear messages when:

- a dataset cannot be parsed
- required Core fields are missing
- an unsupported dataset version is detected

The application should avoid data loss whenever possible.

---

# Keyboard Navigation

Keyboard navigation is considered part of the MVP.

Users should be able to:

- move through Events
- activate controls
- edit fields
- save datasets

without requiring a pointing device.

---

# Future UI Features

Future versions may introduce:

- Timeline filtering
- Timeline search
- Undo / Redo
- Drag-and-drop ordering
- Relative Time editing
- Multiple timeline views
- Split view
- Entity inspector
- Relation inspector
- Keyboard shortcuts
- Customizable layouts
