# NarrativeLine Architecture

This document describes the high-level architecture of NarrativeLine.

It explains how application state, services, and views are organized.

This document is independent of any specific UI framework, although the current implementation targets React.

---

# Design Goals

The architecture aims to:

- Keep responsibilities clearly separated.
- Minimize duplicated logic.
- Centralize state updates.
- Keep views as simple as possible.
- Make future Extensions easy to integrate.
- Support future features such as Undo/Redo.

---

# Overview

NarrativeLine separates the application into five major layers.

```
User
  ↓
Views
  ↓
Services
  ↓
Application State
  ↓
React Rendering
```

Views request operations.

Services perform those operations.

State stores the results.

React automatically updates the visible interface.

---

# Application State

NarrativeLine currently maintains the following application state.

## currentDataset

The currently opened dataset.

This is the primary application data.

Only Services should modify this object.

---

## currentScreen

The currently visible screen.

Examples:

- Home
- Timeline
- EventDetail
- EntityDetail

---

## currentDialog

The currently open dialog.

Examples:

- NewFile
- OpenDataset
- Settings
- DeleteEvent

When no dialog is open:

```
currentDialog = null
```

---

## selectedEvent

The currently selected Event.

Example:

```
selectedEvent = "ev123"
```

---

## selectedEntity

The currently selected Entity.

Example:

```
selectedEntity = "en456"
```

---

# Services

Business logic is implemented inside Services.

Views should request Services instead of directly modifying application state.

---

## EventService

Responsible for Event operations.

Possible functions:

- addEvent()
- deleteEvent()
- updateName()
- updateDescription()
- updateTime()

---

## EntityService

Responsible for Entity operations.

Possible functions:

- addEntity()
- deleteEntity()
- updateName()
- updateDescription()

---

## DatasetService

Responsible for dataset management.

Possible functions:

- createFile()
- importFile()
- exportFile()
- mergeFile() (Future)
- addFile() (Future)
- updateMetadataTitle()
- updateMetadataDescription()

---

## NavigationService

Responsible for screen navigation.

Possible functions:

- home()
- timeline()
- eventDetail()
- entityDetail()

---

## DialogService

Responsible for opening and closing dialogs.

Possible functions:

- newFile()
- sampleFile()
- openDataset()
- writeDataset()
- settings()
- about()
- deleteEvent()
- deleteEntity()
- close()

---

## SelectionService

Responsible for changing the current selection.

Possible functions:

- selectEvent()
- selectEntity()
- clearSelection()

---

# Views

Views display the current application state.

Views should not contain business logic.

Current views include:

- Home
- TimelineView
- EventDetailView
- EntityDetailView

Dialogs are treated separately from Views.

---

# State Ownership

Each state has one primary owner.

| State | Primary Service |
|--------|-----------------|
| currentDataset | DatasetService / EventService / EntityService |
| currentScreen | NavigationService |
| currentDialog | DialogService |
| selectedEvent | SelectionService |
| selectedEntity | SelectionService |

This ownership model helps keep the architecture predictable and reduces duplicated logic.

---

# Typical Flow

For example, adding a new Event.

```
TimelineView
    ↓
EventService.addEvent()
    ↓
currentDataset updated
    ↓
NavigationService.eventDetail()
    ↓
currentScreen updated
    ↓
React re-renders
```

The View does not manipulate state directly.

Instead, it requests a Service to perform the operation.

---

# Directory Structure

A possible project structure is:

```
src/
    components/
    pages/
    hooks/
    models/
    services/
    utils/
    extensions/
```

Responsibilities:

- components : reusable UI components
- pages : application screens
- hooks : React hooks
- models : TypeScript models
- services : business logic
- utils : helper functions
- extensions : Extension-specific logic

---

# Future Architecture

Future versions may introduce additional Services, including:

- HistoryService
- CoordinateService
- LayoutService
- DictionaryService

These Services will manage Extension-specific behavior while keeping the Core architecture unchanged.

---

# Future Features

The current architecture is designed to support future capabilities such as:

- Undo / Redo
- Multiple datasets
- Plugin architecture
- Extension editors
- Multiple synchronized views
- AI-assisted editing
- Collaborative editing

These features should be implementable without fundamentally changing the application architecture.
