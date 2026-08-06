# Navigation

## Purpose

This document describes the screen navigation of NarrativeLine.

It defines the primary user flows independently from implementation details or visual design.

---

# Primary Views

The MVP consists of the following views.

- Home
- Timeline View
- Event Detail
- Entity Picker
- Entity Detail

---

# Navigation Overview

```text
Home
  └── Create Dataset / Import E2R JSON / Open Sample Dataset → Timeline View
        ├── Add Event or Edit selected Event → Event Detail
        │     ├── Save and Add Related Entity → Entity Picker → Event Detail
        │     └── Edit a related Entity → Entity Detail
        └── Back to Home
```

---

# Home

The Home screen is displayed when no dataset is open.

Users can:

- Create a new dataset.
- Open an existing dataset.
- Open the onboarding sample dataset.

Create Dataset and Import E2R JSON are the primary Home actions and have equal
button widths. Open Sample Dataset follows below them as a supplemental
onboarding action.

Opening or creating a dataset navigates to Timeline View.

When importing an existing Dataset, Home reads the selected JSON file and
validates its Core structure before navigation. A failed import remains on Home
and displays the reported validation issues. A successful import replaces the
in-memory Dataset and navigates to Timeline View.

---

# Timeline View

Timeline View is the primary working screen.

Users can:

- Create an Event.
- Select an Event.
- Export the current Dataset as E2R JSON.
- Return to Home.

---

# Event Detail

Event Detail edits a single Event.

Users can edit:

- Name
- Description
- Date
- Related Entities

Saving an Event returns focus to Timeline View.

Canceling an existing Event discards unsaved local changes and returns to
Timeline. Canceling a newly created Event before its first save removes the
draft Event.

Deleting an Event requires a confirmation in Event Detail. Confirming deletion
returns to Timeline; canceling the confirmation keeps Event Detail open.

---

# Entity Picker

Entity Picker allows users to:

- Select existing Entities.
- Create a new Entity.

The required Relation is generated automatically.

Closing Entity Picker returns to Event Detail.

---

# Entity Detail

Entity Detail allows users to edit an Entity's name and description, inspect
related Events, and delete the Entity after confirmation. Deleting an Entity
removes its connected Relations and returns to Timeline; connected Events remain.

---

# Navigation Principles

Navigation should:

- Keep Timeline View as the central workspace.
- Minimize modal dialogs.
- Require as few transitions as possible.
- Preserve the current editing context whenever practical.
