# NarrativeLine State Machine

This document describes how the application state changes in response to user actions.

It complements `architecture.md`.

While `architecture.md` describes the components of the application, this document describes how those components interact during user operations.

---

# Overview

Each user operation changes one or more application states.

The primary application states are:

- dataset
- currentScreen
- currentDialog (reserved and currently `null`)
- selectedEvent
- selectedEntity
- draftEventId

Views request operations.

Services return the next Dataset or application-state value.

App applies returned values to React state.

React re-renders the interface.

---

# Home

## Create New Dataset

```
User
    ↓
DatasetService.createDataset()
    ↓
App applies the returned Dataset to `dataset`
    ↓
selectedEvent = null
    ↓
selectedEntity = null
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

## Open Sample

```
User
    ↓
Onboarding sample selected
    ↓
App applies the selected Dataset to `dataset`
    ↓
selectedEvent = null
    ↓
selectedEntity = null
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

## Import E2R JSON

```text
User selects an E2R JSON file
    ↓
Home reads the file and DatasetService.importDatasetJson() validates it
    ↓
If valid, App applies the imported Dataset to `dataset`
    ↓
selectedEvent = null; selectedEntity = null; draftEventId = null
    ↓
currentScreen = Timeline
```

An invalid file leaves the user on Home and does not replace `dataset`.

---

## Legacy Open Dataset Dialog (Not Implemented)

```
User
    ↓
DialogService.openDataset()
    ↓
currentDialog = OpenDataset
```

---

## Legacy Settings Dialog (Not Implemented)

```
User
    ↓
DialogService.settings()
    ↓
currentDialog = Settings
```

---

# Legacy OpenDataset Dialog (Not Implemented)

## Apply

```
User
    ↓
DatasetService.importFile()
    ↓
App applies the returned Dataset to `dataset`
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
App applies the returned Dataset to `dataset`
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

The new Event ID is also stored as `draftEventId`. Save Event or Save and Add
Entity clears it; Cancel removes the draft Event and its connected Relations.

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

## Legacy Open Menu (Not Implemented)

```
User
    ↓
NavigationService.menu()
```

Implementation is application-defined.

---

# EventDetailView

## Edit Event Fields

```
User edits name, description, or History date
    ↓
Event Detail local state updated
    ↓
dataset React state unchanged
```

The History date editor accepts `year`, `month`, and `day`. Month requires a
year, and day requires a month.

---

## Apply Event Changes

```
User
    ↓
HistoryService.validateHistoryDate()
    ↓
valid
    ↓
EventService.updateEvent(selectedEvent, changedFields)
    ↓
App applies the returned Dataset to `dataset`
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

If the History date is invalid, the Event Detail view displays a validation
message, keeps the local edits, and does not update the `dataset` React state.
Only fields whose editor values differ from their initial values are included in
`changedFields`.

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

## Remove Entity Association

```text
User selects Remove for a related Entity
    ↓
Event Detail opens local removal confirmation
    ↓
User confirms Remove Association
    ↓
EventService.removeEventEntityRelations(selectedEvent, selectedEntity)
    ↓
App applies the returned Dataset to `dataset`
```

Canceling the confirmation leaves the Dataset unchanged. Confirming removal
keeps the Entity and Relations to other Objects.

---

## Open Entity Picker

```
User
    ↓
NavigationService.entityPicker()
    ↓
currentScreen = EntityPicker
```

---

The `Save and Add Related Entity` action validates and saves the Event's local edits
before opening Entity Picker. An invalid History date keeps the user in Event
Detail and does not update the Dataset.

---

## Delete Event (Future DialogService Model)

```
User
    ↓
DialogService.deleteEvent()
    ↓
currentDialog = DeleteEvent
```

---

## Cancel Event Editing

```
User
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

The previously selected Event should remain selected whenever possible.

Canceling an existing Event discards the Event Detail view's unsaved local
edits and does not update the `dataset` React state. It does not undo edits
already saved through Save Event or Save and Add Related Entity.

Canceling a newly created draft Event calls `EventService.deleteEvent()` before
returning to Timeline. The draft Event and any connected Relations are removed,
and `draftEventId` is cleared.

---

# EntityPickerView

Entity Picker operates on the Dataset containing `selectedEvent`.

## Select Existing Entity

```
User
    ↓
EventService.addEventEntityRelation(selectedEvent, entityId)
    ↓
dataset React state updated when no direct Relation already exists
    ↓
NavigationService.eventDetail()
    ↓
currentScreen = EventDetail
```

An existing direct Relation in either direction prevents NarrativeLine from
generating another Relation. Existing Relations are preserved.

---

## Create and Add Entity

```
User
    ↓
EntityService.addEntity(name)
    ↓
App applies the returned Dataset to `dataset`
    ↓
EventService.addEventEntityRelation(selectedEvent, newEntity)
    ↓
App applies the returned Dataset to `dataset`
    ↓
NavigationService.eventDetail()
    ↓
currentScreen = EventDetail
```

Entity names are not identifiers. An Entity may be created even when another
Entity has the same name.

---

## Cancel

```
User
    ↓
NavigationService.eventDetail()
    ↓
currentScreen = EventDetail
```

Canceling does not create an Entity or Relation. It does not undo the Event
edits saved before Entity Picker opened.

---

# Event Detail Delete Confirmation

The current implementation keeps this confirmation as local Event Detail UI
state rather than using `currentDialog` or DialogService.

## Open

```text
User selects Delete Event
    ↓
isDeleteConfirmationOpen = true
    ↓
Dataset remains unchanged
```

## Confirm

```text
User confirms Delete Event
    ↓
EventService.deleteEvent(selectedEvent)
    ↓
App applies the returned Dataset to `dataset`
    ↓
selectedEvent = null
    ↓
NavigationService.timeline()
```

## Cancel

```text
User selects Keep Event
    ↓
isDeleteConfirmationOpen = false
    ↓
Dataset remains unchanged
```

---

# Legacy DialogService Flow (Not Implemented)

## Delete

```
User
    ↓
EventService.deleteEvent(selectedEvent)
    ↓
App applies the returned Dataset to `dataset`
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
App applies the returned Dataset to `dataset`
```

---

## Edit Description

```
User
    ↓
EntityService.updateDescription()
    ↓
App applies the returned Dataset to `dataset`
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
App applies the returned Dataset to `dataset`
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

## Legacy Delete Entity Dialog (Not Implemented)

```
User
    ↓
DialogService.deleteEntity()
    ↓
currentDialog = DeleteEntity
```

---

## Cancel Entity Editing

```
User
    ↓
NavigationService.timeline()
    ↓
currentScreen = Timeline
```

---

# Entity Detail Delete Confirmation

The current implementation keeps this confirmation as local Entity Detail UI
state. It does not use `currentDialog` or DialogService.

## Open

```text
User selects Delete Entity
    ↓
isDeleteConfirmationOpen = true
    ↓
Dataset remains unchanged
```

## Confirm

```text
User confirms Delete Entity
    ↓
EntityService.deleteEntity(selectedEntity)
    ↓
App applies the returned Dataset to `dataset`
    ↓
selectedEntity = null
    ↓
NavigationService.timeline()
```

---

## Cancel

```text
User selects Keep Entity
    ↓
isDeleteConfirmationOpen = false
    ↓
Dataset remains unchanged
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
