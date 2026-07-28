# Implementation Architecture

This document describes how NarrativeLine is organized as a software project.

It bridges the gap between the functional specification and the source code.

The purpose of this document is to define implementation responsibilities before writing code.

---

# Design Principles

The implementation follows the architectural principles described in the design documents.

Responsibilities are separated into independent layers.

- State
- Services
- UI
- Models

Each layer has a clearly defined responsibility.

---

# Layers

## Models

Models represent the E2R data structures.

They contain no UI logic.

Examples include:

- Dataset
- Event
- Entity
- Relation

---

## Store

The Store represents the current application state.

It contains information shared across the application.

Examples include:

- currentDataset
- currentScreen
- currentDialog
- selectedEvent
- selectedEntity

The Store should not contain business logic.

---

## Services

Services perform operations on application data.

Examples include:

- EventService
- EntityService
- DatasetService
- NavigationService
- DialogService

Services update the Store.

Services do not render UI.

---

## Components

Components display reusable user interface elements.

Examples include:

- Timeline
- EventCard
- Toolbar
- Buttons

Components receive state and render it.

Components should contain minimal business logic.

---

## Screens

Screens represent application states.

Examples include:

- Home
- TimelineView
- EventDetailView
- EntityDetailView

A Screen coordinates Components and calls Services.

---

## Dialogs

Dialogs represent temporary modal interfaces.

Examples include:

- New File
- Sample Dataset
- Open Dataset
- Settings
- About

Dialogs are independent UI elements.

---

# Data Flow

The implementation follows a unidirectional data flow.

```
User

↓

Component

↓

Service

↓

Store

↓

Component

↓

Screen
```

The Store acts as the single source of truth for application state.

---

# Directory Structure

The project is expected to follow a structure similar to:

```
src/

    components/

    dialogs/

    hooks/

    models/

    screens/

    services/

    store/

    styles/

    types/

    utils/
```

Additional directories may be introduced when needed.

---

# Relationship to Existing Design Documents

This document complements the existing design documents.

| Document | Purpose |
|----------|---------|
| architecture.md | Overall application architecture |
| state.md | Application state definition |
| state-machine.md | Screen transitions |
| services.md | Service responsibilities |
| navigation.md | Navigation behavior |
| ui-spec.md | User interface specification |
| editing-model.md | Editing workflow |
| implementation.md | Mapping the design to source code |

---

# Future Evolution

This document describes the implementation architecture for the NarrativeLine MVP.

Future versions may introduce:

- Multi-dataset support
- Plugin architecture
- Extension-aware editors
- Collaborative editing

These features should extend the existing architecture rather than replace it.
