# NarrativeLine State Machine

This document describes how the application state changes in response to user actions.

It complements `architecture.md`.

While `architecture.md` describes the components of the application, this document describes how those components interact during user operations.

---

# Overview

Each user operation changes one or more application states.

The primary application states are:

- currentDataset
- currentScreen
- currentDialog
- selectedEvent
- selectedEntity

Views request operations.

Services update state.

React re-renders the interface.

---

# Home

## Create New Timeline

```
User
    ↓
DialogService.newFile()
    ↓
currentDialog = NewFile
```

---

## Open Sample

```
User
    ↓
DialogService.sampleFile()
    ↓
currentDialog = SampleFile
```

---

## Open Dataset

```
User
    ↓
DialogService.openDataset()
    ↓
currentDialog = OpenDataset
```

---

## Settings

```
User
    ↓
DialogService.settings()
    ↓
currentDialog = Settings
```

---

# NewFile Dialog

## Apply

```
User
    ↓
DatasetService.createFile()
    ↓
currentDataset updated
    ↓
DialogService.close()
    ↓
currentDialog = null
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

## Cancel

```
User
    ↓
DialogService.close()
    ↓
currentDialog = null
```

---

# SampleFile Dialog

## Apply

```
User
    ↓
DatasetService.importSample()
    ↓
currentDataset updated
    ↓
DialogService.close()
    ↓
currentDialog = null
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

## Cancel

```
User
    ↓
DialogService.close()
    ↓
currentDialog = null
```

---

# OpenDataset Dialog

## Apply

```
User
    ↓
DatasetService.importFile()
    ↓
currentDataset updated
    ↓
DialogService.close()
    ↓
currentDialog = null
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

## Cancel

```
User
    ↓
DialogService.close()
    ↓
currentDialog = null
```

---

# TimelineView

## Select Event

```
User
    ↓
SelectionService.selectEvent(ev123)
    ↓
selectedEvent = ev123
```

---

## Add Event

```
User
    ↓
EventService.addEvent()
    ↓
currentDataset updated
    ↓
SelectionService.selectEvent(newEvent)
    ↓
selectedEvent = newEvent
    ↓
NavigationService.eventDetail()
    ↓
currentScreen = EventDetail
```

---

## Edit Event

```
User
    ↓
NavigationService.eventDetail()
    ↓
currentScreen = EventDetail
```

---

## Open Entity

```
User
    ↓
SelectionService.selectEntity(en456)
    ↓
selectedEntity = en456
    ↓
NavigationService.entityDetail()
    ↓
currentScreen = EntityDetail
```

---

## Open Menu

```
User
    ↓
NavigationService.menu()
```

Implementation is application-defined.

---

# EventDetailView

## Rename Event

```
User
    ↓
EventService.updateName()
    ↓
currentDataset updated
```

---

## Edit Description

```
User
    ↓
EventService.updateDescription()
    ↓
currentDataset updated
```

---

## Edit Time

```
User
    ↓
EventService.updateTime()
    ↓
currentDataset updated
```

---

## Select Entity

```
User
    ↓
SelectionService.selectEntity(en456)
    ↓
selectedEntity = en456
```

---

## Add Entity

```
User
    ↓
EntityService.addEntity()
    ↓
currentDataset updated
    ↓
SelectionService.selectEntity(newEntity)
    ↓
selectedEntity = newEntity
    ↓
NavigationService.entityDetail()
    ↓
currentScreen = EntityDetail
```

---

## Delete Event

```
User
    ↓
DialogService.deleteEvent()
    ↓
currentDialog = DeleteEvent
```

---

## Back to Timeline

```
User
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

The previously selected Event should remain selected whenever possible.

---

# DeleteEvent Dialog

## Delete

```
User
    ↓
EventService.deleteEvent(selectedEvent)
    ↓
currentDataset updated
    ↓
DialogService.close()
    ↓
currentDialog = null
    ↓
SelectionService.clearSelection()
    ↓
selectedEvent = null
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

## Cancel

```
User
    ↓
DialogService.close()
    ↓
currentDialog = null
```

---

# EntityDetailView

## Rename Entity

```
User
    ↓
EntityService.updateName()
    ↓
currentDataset updated
```

---

## Edit Description

```
User
    ↓
EntityService.updateDescription()
    ↓
currentDataset updated
```

---

## Select Event

```
User
    ↓
SelectionService.selectEvent(ev123)
    ↓
selectedEvent = ev123
```

---

## Add Event

```
User
    ↓
EventService.addEvent()
    ↓
currentDataset updated
    ↓
SelectionService.selectEvent(newEvent)
    ↓
selectedEvent = newEvent
    ↓
NavigationService.eventDetail()
    ↓
currentScreen = EventDetail
```

---

## Delete Entity

```
User
    ↓
DialogService.deleteEntity()
    ↓
currentDialog = DeleteEntity
```

---

## Back to Timeline

```
User
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

# DeleteEntity Dialog

## Delete

```
User
    ↓
EntityService.deleteEntity(selectedEntity)
    ↓
currentDataset updated
    ↓
DialogService.close()
    ↓
currentDialog = null
    ↓
SelectionService.clearSelection()
    ↓
selectedEntity = null
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

## Cancel

```
User
    ↓
DialogService.close()
    ↓
currentDialog = null
```

---

# Design Principles

The state machine follows several principles.

- Each user operation has a clearly defined flow.
- Business logic belongs to Services.
- Views never modify application state directly.
- State changes are centralized.
- React automatically reflects state changes in the user interface.

---

# Future Extensions

Future versions may extend the state machine with additional transitions for:

- Undo / Redo
- Multiple datasets
- Drag and Drop
- Clipboard operations
- Extension editors
- Plugin actions
- AI-assisted editing

The current design intentionally keeps these additions compatible with the existing state model.
