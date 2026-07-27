# NarrativeLine Services

This document describes the responsibilities of each Service used by NarrativeLine.

Services contain business logic.

Views should request Services to perform operations instead of directly modifying application state.

---

# Design Principles

Each Service should have a single responsibility.

Services may update application state, but Views should not.

Whenever possible, one operation should have one implementation.

For example, deleting an Event should always use the same EventService function regardless of which View initiated the request.

---

# EventService

The EventService manages Event objects.

## Responsibilities

- Create Events
- Delete Events
- Update Event properties
- Maintain Event consistency

## Functions

### addEvent()

Creates a new Event.

Updates:

- currentDataset

---

### deleteEvent()

Deletes an Event.

Updates:

- currentDataset

---

### updateName()

Updates the Event name.

Updates:

- currentDataset

---

### updateDescription()

Updates the Event description.

Updates:

- currentDataset

---

### updateTime()

Updates historical time information.

Updates:

- currentDataset

---

# EntityService

The EntityService manages Entity objects.

## Responsibilities

- Create Entities
- Delete Entities
- Update Entity properties

## Functions

### addEntity()

Updates:

- currentDataset

---

### deleteEntity()

Updates:

- currentDataset

---

### updateName()

Updates:

- currentDataset

---

### updateDescription()

Updates:

- currentDataset

---

# DatasetService

The DatasetService manages datasets.

## Responsibilities

- Create datasets
- Import datasets
- Export datasets
- Update metadata

## Functions

### createFile()

Creates an empty dataset.

Updates:

- currentDataset

---

### importFile()

Loads a dataset.

Updates:

- currentDataset

---

### exportFile()

Exports the current dataset.

Does not modify application state.

---

### mergeFile() (Future)

Merges another dataset into the current dataset.

Updates:

- currentDataset

---

### addFile() (Future)

Adds an additional dataset.

Updates:

- currentDataset

---

### updateMetadataTitle()

Updates:

- currentDataset

---

### updateMetadataDescription()

Updates:

- currentDataset

---

# NavigationService

The NavigationService changes the visible screen.

## Responsibilities

- Screen navigation

## Functions

### home()

Updates:

- currentScreen

---

### timeline()

Updates:

- currentScreen

---

### eventDetail()

Updates:

- currentScreen

---

### entityDetail()

Updates:

- currentScreen

---

# DialogService

The DialogService controls dialogs.

## Responsibilities

- Open dialogs
- Close dialogs

## Functions

### newFile()

Updates:

- currentDialog

---

### sampleFile()

Updates:

- currentDialog

---

### openDataset()

Updates:

- currentDialog

---

### writeDataset()

Updates:

- currentDialog

---

### settings()

Updates:

- currentDialog

---

### about()

Updates:

- currentDialog

---

### deleteEvent()

Updates:

- currentDialog

---

### deleteEntity()

Updates:

- currentDialog

---

### close()

Updates:

- currentDialog

Sets:

```
currentDialog = null
```

---

# SelectionService

The SelectionService manages the current selection.

## Responsibilities

- Select Events
- Select Entities
- Clear selections

## Functions

### selectEvent(eventId)

Updates:

- selectedEvent

---

### selectEntity(entityId)

Updates:

- selectedEntity

---

### clearSelection()

Updates:

- selectedEvent
- selectedEntity

---

# State Ownership

Each application state has a primary owner.

| State | Owner |
|--------|-------|
| currentDataset | EventService, EntityService, DatasetService |
| currentScreen | NavigationService |
| currentDialog | DialogService |
| selectedEvent | SelectionService |
| selectedEntity | SelectionService |

This ownership should be respected throughout the application.

---

# Service Cooperation

A typical user operation involves multiple Services.

Example:

```
TimelineView
    ↓
EventService.addEvent()
    ↓
SelectionService.selectEvent()
    ↓
NavigationService.eventDetail()
    ↓
React re-renders
```

Each Service performs one responsibility before handing control to the next.

---

# Future Services

Future versions of NarrativeLine may introduce additional Services.

Possible examples include:

- HistoryService
- CoordinateService
- LayoutService
- DictionaryService
- ExtensionService
- UndoService
- ClipboardService
- SearchService
- ValidationService
- PluginService

The current architecture is designed so that new Services can be added without changing the responsibilities of existing Services.
