# NarrativeLine State

This document defines the application state used by NarrativeLine.

Application state represents the information that must be remembered while the application is running.

Views display the current state and invoke callbacks for user actions.

Services provide state-transition and Dataset-operation logic. App owns the
React state and applies the values returned by Services.

React automatically updates the user interface when the state changes.

---

# Design Principles

The application state should be as small as possible.

Each state has a single purpose.

App has one authoritative React state value for each concern.

Business logic should be implemented through Services, while React state
updates remain in App.

---

# State Overview

NarrativeLine currently maintains the following application state.

| State | Purpose | React owner | Operation logic |
|-------|---------|-------------|-----------------|
| dataset | Current Dataset data | App | DatasetService / EventService / EntityService |
| currentScreen | Current screen | App | NavigationService |
| currentDialog | Reserved shared-dialog state; currently always `null` | App | None |
| selectedEvent | Selected Event | App | App coordination |
| selectedEntity | Selected Entity | App | App coordination |
| draftEventId | Newly created Event awaiting its first save | App | App |

---

# dataset

The current in-memory Dataset.

This is the primary data of the application.

Almost every editing operation eventually modifies this state.

Examples:

- Creating a new Event
- Renaming an Entity
- Editing historical time
- Importing a dataset

Example:

```
dataset = {
    version: "1.0",
    entities: [],
    events: [],
    relations: [],
    extensions: {
        metadata: {
            datasetId: "..."
        }
    }
}
```

App owns this React state. DatasetService, EventService, and EntityService
return new Dataset values for App to apply.

The Metadata Extension and `datasetId` are optional for imported Datasets.
Their absence does not mean that no Dataset is open.

---

# currentScreen

The screen currently displayed to the user.

Possible values include:

- Home
- Timeline
- EventDetail
- EntityPicker
- EntityDetail

Example:

```
currentScreen = Timeline
```

Only the NavigationService should modify this state.

---

# currentDialog

`currentDialog` is reserved for a future shared-dialog mechanism and is
currently always `null`.

```
currentDialog = null
```

The current delete and association-removal confirmations use local state inside
Event Detail or Entity Detail. DialogService is not implemented.

---

# selectedEvent

The currently selected Event.

This represents the user's current focus.

Example:

```
selectedEvent = "ev123"
```

Typical situations:

- Selecting a row in TimelineView
- Opening EventDetailView
- Returning from EventDetailView

App updates this state as part of navigation and selection callbacks.

---

# selectedEntity

The currently selected Entity.

Example:

```
selectedEntity = "en456"
```

Typical situations:

- Selecting an Entity from EventDetailView
- Opening EntityDetailView
- Returning from EntityDetailView

App updates this state as part of navigation and selection callbacks.

---

# draftEventId

The identifier of an Event created through Add Event that has not yet been
saved. This is application state only and is never written to the Dataset.

Canceling Event Detail for this Event removes it and its connected Relations.
Saving it, using Save and Add Related Entity, deleting it, or opening another
Dataset clears `draftEventId`.

---

# State Lifetime

Some states change frequently.

Examples:

- selectedEvent
- selectedEntity

Other states change less often.

Examples:

- dataset
- currentScreen

Understanding the lifetime of each state helps reduce unnecessary updates.

---

# State Ownership

App owns each React state value. Services own the corresponding operation
logic.

```
dataset
    ↑
DatasetService
EventService
EntityService
```

```
currentScreen
    ↑
NavigationService
```

```
currentDialog
    ↑
Future DialogService (not implemented)
```

```
selectedEvent
selectedEntity
    ↑
App coordination
```

Views invoke callbacks rather than mutating these states directly. App applies
the next values returned by Services or produced by its coordination logic.

---

# State Relationships

Some states naturally work together.

Example:

```
currentScreen = EventDetail
selectedEvent = "ev123"
```

This means:

"The Event Detail screen is displaying Event ev123."

Delete and association-removal confirmations are local screen state rather than
part of `AppState`.

These combinations define the current situation of the application.

---

# State Transitions

State changes are described in detail in `state-machine.md`.

Typical flow:

```
User
    ↓
Service
    ↓
State Updated
    ↓
React Re-renders
```

The application never jumps directly from user actions to rendering.

State is always the source of truth.

---

# Future State

Future versions of NarrativeLine may introduce additional application state.

Possible examples include:

- currentTool
- currentFilter
- currentSearch
- currentSort
- currentDatasetList
- clipboard
- undoStack
- redoStack
- extensionState

These additions should follow the same principles of clear ownership and single responsibility.
