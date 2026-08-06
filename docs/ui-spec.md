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

# Button Presentation

All views and confirmation dialogs use the same button height, padding, border
width and color, corner radius, typography, background, hover treatment, focus
treatment, and disabled treatment.

Button hover backgrounds use an opaque theme-specific color so text remains
readable in both light and dark mode, including inside confirmation dialogs.
Confirmation surfaces use the same theme background and text colors as the
application frame.

Destructive actions use the same button structure and border as other actions.
They may use red text to communicate their effect, while separation into a
Danger Zone and confirmation remain the primary safeguards against accidental
activation.

---

# Screens and Dialogs

A workflow should use a dedicated screen when it includes a searchable or
expandable collection, combines selection with creation, or benefits from the
full available viewport.

A dialog should be reserved for a brief task subordinate to the current screen,
such as confirmation, warning, or limited input that immediately returns to the
same context.

Dialogs require appropriate focus management, keyboard dismissal, focus
restoration, and prevention of unintended interaction with the background.

---

# Primary Views

The MVP consists of five primary views.

- Home
- Timeline View
- Event Detail
- Entity Picker
- Entity Detail

---

# Shared Application Frame

Every primary view is displayed inside the same application frame. The Header
displays the `NarrativeLine` brand, and the Footer identifies the application as
an `E2R timeline editor`. The Footer also provides a `Credits` action.

The shared frame does not change navigation or editing state. Screen-specific
titles and actions remain in the screen content. Header and Footer padding is
reduced at viewport widths of 600 px or less.

The Credits modal displays the public application version, creator name,
release date, AI acknowledgement, and links to both the NarrativeLine and E2R
specification repositories. It can be dismissed with `Close`, Escape, or the
shared modal dismissal behavior.

---

# Application Flow

Users can begin by:

- Opening the onboarding dataset.
- Creating a new empty dataset.
- Opening an existing dataset.

Creating a new Dataset and opening the onboarding sample are separate Home
actions. Creating an empty Dataset requires no initial input, does not open a
dialog, and navigates directly to Timeline View.

Opening an existing Dataset is an `Import E2R JSON` Home action. Home accepts a
selected JSON file, displays an importing state while reading it, and navigates
to Timeline View only after Core validation succeeds.

Home orders its actions as Create Dataset, Import E2R JSON, then Open Sample
Dataset. The first two are primary actions with equal full button widths. Open
Sample Dataset is separated below them as an onboarding action.

Because the shared Header carries the product name, the Home screen uses `Get
Started` as its screen heading.

---

# Timeline View

Timeline View is the primary screen.

It displays Events in chronological order.

Users can:

- Create an Event.
- Select an Event.
- Open the selected Event for editing.
- Export the current Dataset as E2R JSON.
- Return to Home.

Timeline View does not edit Event details directly.

When a selected Event has a description, Timeline displays only its first line
as a single-line preview. Text beyond the available card width is clipped with
an ellipsis, including long strings without spaces. The stored description is
not shortened.

Timeline cards and their content rows are constrained to the available content
width. Screen padding is included in that width, so a selected card and its
preview do not create horizontal overflow.

Event names use the same single-line ellipsis treatment as description
previews. The full Event name remains available in Event Detail for editing.

The Timeline action that returns to Home is labeled `Home` without a directional
arrow.

---

# Event Detail

Event Detail is used to edit a single Event.

Editable fields include:

- Name
- Description
- Date
- Related Entities

Event Detail keeps field edits locally until the user invokes `Save Event` or
`Save and Add Related Entity`. Invalid date input prevents either action.

The Detail heading uses a compact size and keeps visible spacing between the
screen title and the current Event name.

The current Event name beneath the Event Detail heading is a single-line
ellipsis preview. The complete name remains available in the Name field.

Each related Entity is displayed as an individually bordered card. Selecting a
card applies the shared accent border and background and exposes its contextual
actions. `Remove Association` uses destructive styling without being presented
as Entity deletion.

`Cancel` discards unsaved local edits and returns to Timeline for an existing
Event. It does not undo an edit already saved through `Save Event` or `Save and
Add Related Entity`. For a new Event before its first save, `Cancel` removes
the draft Event.

Saving the dataset is a separate operation.

`Cancel` and `Save Event` form the primary action group. `Delete Event` is
placed in a separate Danger Zone below that group.

---

# Date Editor

History date-only information is edited using independent numeric fields.

Fields:

- Year
- Month
- Day

The three fields use equal compact widths of `9rem` when displayed in one row;
they do not expand to fill the Detail screen. At viewport widths of 600 px or
less, they are stacked vertically at full width.

The editor supports year, year-month, and year-month-day precision. Year accepts
zero and negative integers using astronomical year numbering.

Month is disabled until year is present. Day is disabled until year and month
are present. Clearing year also clears month and day. Clearing month also clears
day.

The editor reports non-integer fields, month range errors, and invalid Gregorian
days, including leap-year errors. While an error is present, the apply action is
disabled.

Unknown finer values are omitted. Date-only input is not interpreted as
midnight. Removing all date fields removes the Time Object unless another valid
History field requires it.

## Clock and Time Zone Controls (Deferred)

Future controls may include:

- Hour
- Minute
- Second
- IANA Time Zone
- UTC offset

These controls may be placed inside a collapsible section when implemented.

---

# Entity Picker

Entity Picker is a dedicated screen rather than a dialog.

Its user-facing heading is `Add Related Entity`.

Users may associate zero or more Entities with an Event.

Entity association is optional.

Event Detail opens Entity Picker through a `Save and Add Related Entity` action.
This action saves valid local Event edits before navigation so that the user
does not lose them when returning from the picker.

`Add Entity` on an existing Entity creates the necessary Relation
automatically. An Entity already associated with the Event is labeled `Already
Related` and cannot be added again.

`Create and Add` creates a new Entity and associates it with the Event.

Entity Picker displays each existing Entity as an individually bordered card.
Its card footer and creation controls wrap as needed and stack vertically at
viewport widths of 600 px or less. Long button labels may wrap within their
buttons.

Entity names and descriptions in the picker use single-line ellipsis previews;
the stored Entity values are not shortened.

When the creation controls stack, the Entity name input keeps its normal control
height rather than inheriting the desktop horizontal flex basis as height.

Core Object IDs are not displayed in Entity Picker. They remain part of the
Dataset but are not needed to choose an Entity in this workflow.

In Event Detail, selecting a related Entity exposes `Edit Entity` and `Remove
Association`. Confirmation is required before removing the Event–Entity
association. The Entity remains in the Dataset, and Relations to other Objects
are not affected.

Event deletion, Entity deletion, and association-removal confirmations are
modal overlays. While one is open, the controls behind it cannot be activated.

Opening a confirmation moves keyboard focus to its non-destructive action. Tab
and Shift+Tab keep focus within the confirmation. Escape cancels the
confirmation, and closing it returns focus to the control that opened it when
that control remains available.

The focused confirmation action always displays the shared focus ring,
including when focus was moved programmatically after a pointer activation.

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

Saved changes are reflected in Timeline.

Timeline ordering updates automatically when a saved temporal value changes.

Canceling an existing Event discards only unsaved local edits. Canceling a new
Event before its first save removes the draft Event instead of leaving an empty
Timeline entry.

---

# Deleting an Event

Selecting `Delete Event` opens a confirmation in Event Detail. The confirmation
explains that deletion permanently removes the Event and connected Relations and
discards any local unsaved edits. Canceling the confirmation leaves the Dataset
unchanged.

Confirming deletion removes:

- the Event itself
- Relations connected to the Event

Associated Entities remain unless explicitly removed.

---

# Deleting an Entity

Entity Detail uses the same compact Detail heading and related-card treatment
as Event Detail. Each related Event is individually bordered, and selecting it
applies the shared accent border and background before exposing `Edit Event`.

A selected related Event uses the same first-line, single-line description
preview as Timeline. This keeps Event description presentation consistent and
prevents long text from expanding or overflowing the card.

`Cancel` and `Save Entity` form the primary action group. `Delete Entity` is
placed in a separate Danger Zone below that group.

Selecting `Delete Entity` in Entity Detail opens a confirmation. Confirming
deletion permanently removes the Entity and every Relation connected to it, then
returns to Timeline View. Connected Events remain in the Dataset. Canceling the
confirmation leaves the Dataset unchanged.

---

# Timeline Ordering

Timeline View displays Events using:

1. Valid recorded dates before Events without a recorded date
2. Stored Civil Time year, month, and day values
3. Temporal precision, with coarser precision first for an equal prefix
4. `temporalOrder` when recorded date fields cannot distinguish Events
5. Event ID

Events without temporal information appear after dated Events in the MVP.

Displayed date precision matches the stored precision:

```text
1945
1945-08
1945-08-15
```

---

# Exporting

Timeline exports the current Dataset as `e2r-dataset.e2r.json`.

Before export:

- Core validity is verified.
- Recorded `temporalOrder` values are preserved and are not generated merely
  to reproduce Timeline presentation order.
- Unknown Extensions should be preserved whenever possible.
- Dataset structure should change as little as possible.

Exporting does not modify the in-memory Dataset. A validation or serialization
failure does not start a download and is displayed in Timeline.

---

# Loading

Loading replaces the current dataset.

During loading:

- Dataset validity is verified.
- Unsupported Extensions are ignored.
- Unknown Extensions are preserved whenever possible.
- A parse or validation failure leaves the user on Home and does not replace
  the in-memory Dataset.

---

# Error Handling

The application should display clear messages when:

- a dataset cannot be parsed
- required Core fields are missing
- Relation endpoints cannot be resolved

Core validation messages include a stable error code and JSON Pointer path.
The application should avoid data loss whenever possible.

---

# Keyboard Navigation

Keyboard navigation is considered part of the MVP.

Users should be able to:

- activate controls
- edit fields
- use modal confirmations

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
