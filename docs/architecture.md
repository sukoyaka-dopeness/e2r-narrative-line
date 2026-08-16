# NarrativeLine Architecture

## Overview

NarrativeLine is the reference application for the E2R-SPEC project.

Its primary purpose is not to provide a feature-complete timeline editor, but to validate the E2R data model through practical use.

The application focuses on editing and exploring E2R datasets while keeping the implementation as simple and transparent as possible.

---

# Goals

* Provide a minimal reference implementation of E2R-SPEC.
* Keep application architecture independent from the data specification.
* Separate UI, state management, and data manipulation.
* Make future extensions possible without changing the Core architecture.

---

# Current Architecture

```
App

└── AppFrame
    ├── Header
    ├── HomeScreen / TimelineScreen / EventDetailScreen /
    │   EntityPickerScreen / EntityCreateScreen / EntityDetailScreen
    └── Footer (Home only)
```

App.tsx is responsible for application state and screen navigation.

Individual screens are responsible only for presentation and user interaction.

AppFrame provides the shared NarrativeLine Header around the current screen and
the application Footer on Home only. It owns no Dataset, navigation, selection,
or editing state.

---

# Screen Responsibilities

## HomeScreen

Entry point of the application.

Responsibilities:

* Create a new Dataset
* Open the onboarding sample Dataset
* Import an E2R JSON Dataset
* Future dataset operations

Planned:

* Settings

---

## TimelineScreen

Displays Events in chronological order.

Responsibilities:

* Display Event list
* Select Event
* Open Event editor
* Create Event
* Export the current Dataset as E2R JSON

The Timeline is Event-centric.

Entities are accessed through Event Detail.

---

## EventDetailScreen

Displays and edits a single Event.

Responsibilities:

* Edit Event
* Delete Event
* Display Related Entities
* Open Entity Picker
* Navigate to Entity Detail
* Remove Related Entity associations

---

## EntityPickerScreen

Displays Entities from the Dataset containing the edited Event.

Responsibilities:

* Select an existing Entity
* Open Entity Create
* Associate the selected Entity with the Event
* Return to Event Detail without modifying the Dataset

---

## EntityCreateScreen

Creates a new Entity in the context of the selected Event.

Responsibilities:

* Edit the new Entity name and description
* Create the Entity and associate it with the selected Event
* Return to Entity Picker without modifying the Dataset

---

## EntityDetailScreen

Displays a single Entity.

Responsibilities:

* Display and edit Entity information
* Display Related Events
* Navigate to Event Detail
* Delete Entity with connected Relation cleanup

---

# State Management

React state is centralized in App.tsx.

Current state:

```
dataset
state.currentScreen
state.currentDialog
state.selectedEvent
state.selectedEntity
state.draftEventId
```

`dataset` contains the current in-memory E2R Dataset. It is separate from
`AppState`; an optional `extensions.metadata.datasetId` is Dataset data and is
not used as application state indicating whether a Dataset is open.

Screens receive only the state required for display.

---

# Services

Services contain business logic.

Current services:

```
NavigationService
EventService
EntityService
DatasetService
LegacyDatasetService
SpecificationDeclarationService
IdentifierService
HistoryService
CoordinateService
ValidationService
```

Planned services:

```
RelationService
DialogService
SelectionService
```

Services should be UI-independent.

---

# Data Flow

Typical editing flow:

```
Timeline

↓

Select Event

↓

Event Detail

↓

EventService

↓

Updated Dataset returned to App

↓

App updates the `dataset` React state

↓

Timeline Refresh
```

Screens invoke callbacks and never modify Datasets directly.

Dataset manipulation is performed by UI-independent Services that return new
Dataset values for App to apply.

`CoordinateService` resolves the unregistered Coordinate interoperability format
into display values. Its bounded writer returns a new Dataset only for an
explicit update of existing Entity `x` and `y` values in exact supported graph
Spaces (`liaisonscape-graph` canonical or `linkscape-graph` legacy). It neither
creates Coordinate structures nor writes unsupported
Spaces. Entity Detail and Event Detail share `CoordinatePanel` for Space
selection and value display; only Entity Detail supplies the bounded writer.
The selected Space and unsaved numeric input remain local React UI state and
are not Dataset content.

---

# Navigation

Current navigation:

```
Home

↓

Timeline

↓

Event Detail
```

Planned navigation:

```
Home

↓

Timeline

↓

Event Detail

↓

Entity Detail

↓

Related Events

↓

Event Detail
```

This bidirectional navigation reflects the relationship between Events and Entities in E2R.

---

# UI Principles

The MVP intentionally separates selection from editing.

Planned interaction:

* Click row → Select
* Click ✏ → Edit

This pattern will be shared by Event lists and Entity lists.

---

# Relation Handling

NarrativeLine does not expose Relations as a primary screen.

Instead, Relations are presented indirectly through:

* Related Entities
* Related Events

This keeps the application focused on user workflows rather than internal data structures.

---

# Dataset Handling

The current implementation holds one in-memory Dataset at a time. Home can
create a new Dataset, open the onboarding sample Dataset, or import an E2R JSON
Dataset.

DatasetService currently creates new Datasets using the Core `version`, empty
Core collections, and `extensions.metadata.datasetId` generated as UUID v7.

Import is a boundary pipeline: JSON parsing, exact legacy-profile recognition,
pure in-memory migration when matched, and complete validation with the current
E2R Validator. Legacy representation is never introduced into the current
in-memory model, and opening a source does not overwrite it. Profile contracts
and regression fixtures are append-only; see
`legacy-dataset-compatibility.md`.

Export first validates the in-memory Dataset, then asks
`SpecificationDeclarationService` to add a complete exact-version declaration
to a separate output value when possible, and validates that output again.
Existing declarations are never replaced, and unknown Extension versions
prevent automatic declaration rather than producing an incomplete `uses`
list. The in-memory Dataset remains unchanged.

Future Dataset handling will add:

* Save Dataset
* Multiple datasets

---

# Future Components

Planned additions include:

* Relation editing
* Dataset management
* Dictionary support
* History clock and Time Zone editing
* Search
* Filtering
* View customization

These features should be implemented without changing the fundamental application architecture.

---

# Design Philosophy

NarrativeLine is intentionally simple.

The application exists to validate E2R-SPEC through real editing workflows.

Whenever possible, architectural simplicity is preferred over feature richness.

The application should remain understandable, extensible, and suitable as a reference implementation for future E2R-based applications.
