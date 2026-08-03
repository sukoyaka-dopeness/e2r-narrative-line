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

├── HomeScreen
├── TimelineScreen
├── EventDetailScreen
└── EntityDetailScreen
```

App.tsx is responsible for application state and screen navigation.

Individual screens are responsible only for presentation and user interaction.

---

# Screen Responsibilities

## HomeScreen

Entry point of the application.

Responsibilities:

* Open Timeline
* Future dataset operations

Planned:

* New Dataset
* Open Dataset
* Sample Dataset
* Import
* Export
* Settings

---

## TimelineScreen

Displays Events in chronological order.

Responsibilities:

* Display Event list
* Select Event
* Open Event editor
* Create Event

The Timeline is Event-centric.

Entities are accessed through Event Detail.

---

## EventDetailScreen

Displays and edits a single Event.

Responsibilities:

* Edit Event
* Delete Event
* Display Related Entities

Future:

* Navigate to Entity Detail
* Add / Remove Related Entities

---

## EntityDetailScreen

Displays a single Entity.

Responsibilities:

* Display Entity information

Future:

* Edit Entity
* Display Related Events
* Navigate back to Event Detail

---

# State Management

Application state is centralized in App.tsx.

Current state:

```
currentScreen
currentDataset
currentDialog
selectedEvent
selectedEntity
```

Screens receive only the state required for display.

---

# Services

Services contain business logic.

Current services:

```
NavigationService
EventService
```

Planned services:

```
EntityService
RelationService
DatasetService
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

Dataset

↓

React State Update

↓

Timeline Refresh
```

Screens never modify datasets directly.

All dataset manipulation should eventually be performed by Services.

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

Current implementation uses a single in-memory sample dataset.

Future versions will introduce DatasetService to support:

* New Dataset
* Open Dataset
* Save Dataset
* Import
* Export
* Multiple datasets

---

# Future Components

Planned additions include:

* Entity editing
* Relation editing
* Dataset management
* Dictionary support
* History Extension support
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
