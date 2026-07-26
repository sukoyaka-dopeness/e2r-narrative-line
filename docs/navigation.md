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
- Dataset Settings

---

# Navigation Overview

```text
                 +----------------------+
                 |        Home          |
                 +----------------------+
                  |       |        |
                  |       |        |
      Open Sample |       | New Dataset
                  |       |
          Open Dataset    |
                  |       |
                  +-------+
                      |
                      v
          +----------------------+
          |    Timeline View     |
          +----------------------+
             |      |        |
             |      |        |
     New     |      | Select Event
     Event   |      |
             |      |
             |      v
             | +----------------------+
             | |    Event Detail      |
             | +----------------------+
             |      |
             |      |
             |      | Edit Entities
             |      |
             |      v
             | +----------------------+
             | |    Entity Picker     |
             | +----------------------+
             |      |
             +------+
                    |
                    v
          +----------------------+
          |    Timeline View     |
          +----------------------+

From Timeline View:

    Dataset Settings
```

---

# Home

The Home screen is displayed when no dataset is open.

Users can:

- Open the onboarding sample dataset.
- Create a new dataset.
- Open an existing dataset.

Opening or creating a dataset navigates to Timeline View.

---

# Timeline View

Timeline View is the primary working screen.

Users can:

- Create an Event.
- Select an Event.
- Delete an Event.
- Save the dataset.
- Load another dataset.
- Open Dataset Settings.

---

# Event Detail

Event Detail edits a single Event.

Users can edit:

- Name
- Description
- Date
- Time
- Related Entities

Saving an Event returns focus to Timeline View.

---

# Entity Picker

Entity Picker allows users to:

- Select existing Entities.
- Create a new Entity.

The required Relation is generated automatically.

Closing Entity Picker returns to Event Detail.

---

# Dataset Settings

Dataset Settings edits dataset metadata.

For the MVP, editable fields are:

- Title
- Description

Saving returns to Timeline View.

---

# Navigation Principles

Navigation should:

- Keep Timeline View as the central workspace.
- Minimize modal dialogs.
- Require as few transitions as possible.
- Preserve the current editing context whenever practical.
