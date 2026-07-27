# NarrativeLine State

This document defines the application state used by NarrativeLine.

Application state represents the information that must be remembered while the application is running.

Views display the current state.

Services modify the current state.

React automatically updates the user interface when the state changes.

---

# Design Principles

The application state should be as small as possible.

Each state has a single purpose.

Each state has a clearly defined owner.

Business logic should modify state only through Services.

---

# State Overview

NarrativeLine currently maintains the following application state.

| State | Purpose | Primary Owner |
|--------|----------|---------------|
| currentDataset | Current dataset | DatasetService / EventService / EntityService |
| currentScreen | Current screen | NavigationService |
| currentDialog | Current dialog | DialogService |
| selectedEvent | Selected Event | SelectionService |
| selectedEntity | Selected Entity | SelectionService |

---

# currentDataset

The currently loaded dataset.

This is the primary data of the application.

Almost every editing operation eventually modifies this state.

Examples:

- Creating a new Event
- Renaming an Entity
- Editing historical time
- Importing a dataset

Example:

```
currentDataset = {
    metadata: ...,
    entities: ...,
    events: ...
}
```

Owner:

- DatasetService
- EventService
- EntityService

---

# currentScreen

The screen currently displayed to the user.

Possible values include:

- Home
- Timeline
- EventDetail
- EntityDetail

Example:

```
currentScreen = Timeline
```

Only the NavigationService should modify this state.

---

# currentDialog

The dialog currently displayed.

Only one dialog may be open at a time.

Possible values include:

- NewFile
- SampleFile
- OpenDataset
- WriteDataset
- Settings
- About
- DeleteEvent
- DeleteEntity

When no dialog is open:

```
currentDialog = null
```

Only the DialogService should modify this state.

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

The SelectionService manages this state.

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

The SelectionService manages this state.

---

# State Lifetime

Some states change frequently.

Examples:

- selectedEvent
- selectedEntity

Other states change less often.

Examples:

- currentDataset
- currentScreen

Understanding the lifetime of each state helps reduce unnecessary updates.

---

# State Ownership

Each state has one primary owner.

```
currentDataset
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
DialogService
```

```
selectedEvent
selectedEntity
    ↑
SelectionService
```

Views should never modify these states directly.

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

Another example:

```
currentDialog = DeleteEvent
selectedEvent = "ev123"
```

This means:

"The Delete Event confirmation dialog is open for Event ev123."

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
