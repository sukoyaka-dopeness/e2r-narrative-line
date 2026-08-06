# Implementation Architecture

This document describes how NarrativeLine is organized as a software project.

It bridges the gap between the functional specification and the source code.

The purpose of this document is to keep implementation responsibilities aligned
with the current source code as the MVP evolves.

---

# Design Principles

The implementation follows the architectural principles described in the design documents.

Responsibilities are separated into independent layers.

- React State
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

- CoreObject
- Dataset
- Event
- Entity
- Relation
- HistoryExtension
- MetadataExtension

---

## React State

App owns the current React state.

The Dataset is held separately from navigation and selection state:

```text
dataset
state.currentScreen
state.currentDialog
state.selectedEvent
state.selectedEntity
```

An optional `extensions.metadata.datasetId` is Dataset data. It is not an
application-state key and its absence does not mean that no Dataset is open.

React state should not contain business logic.

---

## Services

Services perform operations on application data.

Examples include:

- EventService
- EntityService
- DatasetService
- IdentifierService
- HistoryService
- ValidationService
- NavigationService

Services are UI-independent. Data Services return new Dataset values, and
NavigationService returns the next AppState value. ValidationService returns a
validation result. App applies returned values to React state.

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
- EntityPickerView
- EntityDetailView

A Screen coordinates Components and calls Services.

---

## Dialogs

Dialogs may represent brief temporary tasks when they are introduced.

Possible examples include:

- Open Dataset
- Settings
- About

Dataset creation and onboarding sample selection are direct Home actions, not
dialogs.

---

# Data Flow

The implementation follows a unidirectional data flow.

```
User

↓

Screen callback

↓

App coordination

↓

Service returns the next value

↓

App React state update

↓

Screen re-render
```

App's React state acts as the single source of truth for current application
state. The in-memory Dataset remains the source of truth for edited E2R data.

---

# Directory Structure

The current source structure is:

```
src/

    assets/

    models/

    sample/

    screens/

    services/

    state/

    App.tsx

    main.tsx

    index.css
```

Reusable components, hooks, dialogs, or utilities should receive their own
directories only when the implementation requires them.

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
| Implementation.md | Mapping the design to source code |

---

# Future Evolution

This document describes the implementation architecture for the NarrativeLine MVP.

Future versions may introduce:

- Multi-dataset support
- Plugin architecture
- Extension-aware editors
- Collaborative editing

These features should extend the existing architecture rather than replace it.
