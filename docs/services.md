# NarrativeLine Services

This document describes the responsibilities of each Service used by NarrativeLine.

Services contain business logic.

Views should request operations through callbacks instead of directly modifying
Dataset or application state.

---

# Design Principles

Each Service should have a single responsibility.

Services are UI-independent. Data Services return new Dataset values, while
Navigation and future state-oriented Services return the next application
state. App owns the React state and applies the returned values.

Whenever possible, one operation should have one implementation.

For example, deleting an Event should always use the same EventService function regardless of which View initiated the request.

---

# EventService

The EventService manages Event objects.

## Responsibilities

- Create Events
- Delete Events
- Update Event properties
- Write date-only History Extension values
- Associate Events with Entities
- Maintain Event consistency

## Functions

### addEvent()

Creates a new Event.

Returns:

- an updated Dataset and the new Event ID

---

### deleteEvent()

Deletes an Event.

Returns:

- an updated Dataset

---

### updateEvent()

Updates the Event name, description, and contiguous date/time History
information.

Date and optional time information is written to `extensions.history.time`. The
service validates year, month, day, hour, minute, and second before writing,
preserves unrelated Extensions, removes invalid dependent finer fields when
precision is reduced, and does not leave an empty Time Object. It does not
write the legacy top-level `date` field.

Returns:

- an updated Dataset

---

### addEventEntityRelation()

Creates an Event-to-Entity Relation unless a direct Relation already connects
the same objects in either direction. Existing Relations are preserved.

Returns:

- the original Dataset when a direct Relation already exists, otherwise an
  updated Dataset containing the new Relation

---

### removeEventEntityRelations()

Removes every direct Relation between the specified Event and Entity, in either
direction. The Entity and Relations to other Objects are preserved.

Returns:

- an updated Dataset

---

# HistoryService

The HistoryService provides pure read, validation, display, and comparison
operations for date-only History information.

## Responsibilities

- Read year, month, and day from `extensions.history.time`
- Validate contiguous date precision
- Validate proleptic Gregorian month lengths and leap years
- Format year, month, and day without inventing missing precision
- Compare Events for Timeline presentation without reordering the Dataset
- Return stable validation error codes for later UI localization

## Functions

### getEventHistoryDate()

Returns the recorded year, month, and day without interpreting an omitted field.
The legacy top-level `date` field is not read.

---

### validateHistoryDate()

Validates integer fields, field dependencies, month range, and Gregorian day
validity. Year zero and negative years are accepted.

---

### formatEventHistoryDate()

Formats the recorded precision as a year, year-month, or year-month-day string.
It does not add a clock value or interpret date-only information as midnight.

---

### compareEventsByHistoryDate()

Orders a derived Timeline collection by valid stored date fields, precision,
`temporalOrder` when applicable, and Event ID. Events without a valid recorded
date follow dated Events.

---

# CoordinateService

CoordinateService provides UI-independent interpretation and a bounded
second-writer experiment for Coordinate prototype `0.1.0`.

## Responsibilities

- Recognize the exact authority-qualified experimental identifier and format
  version
- Resolve object Coordinates through Dataset-level Space definitions
- Resolve numeric values by stable Component ID
- Preserve partial Coordinates and report missing Components without inventing
  values
- Distinguish absent, available, unsupported-version, and inconsistent payloads
- Restrict writing to existing Entity `x` and `y` values in the exact
  `linkscape-graph` legacy or `liaisonscape-graph` canonical Space definition
- Refuse unsupported versions, incompatible Space semantics, missing
  Coordinates, unknown write Components, non-finite values, and bound violations
- Preserve unknown fields, other Components, other Spaces, and Coordinate order

## Functions

### readObjectCoordinates()

Returns the Coordinates that can be interpreted for one Entity or Event. Each
result includes its Space identity, optional display metadata, recorded values,
and unrecorded Components. Unsupported and inconsistent payloads return an
explicit status rather than best-effort numeric values.

### isCoordinateWriteSupported()

Returns true only for a complete recorded `x`/`y` Coordinate whose Space ID,
Cartesian kind, units, and positive directions exactly match the shared
graph-coordinate experiment. General numeric display does not imply write support.

### updateObjectCoordinate()

Returns an updated Dataset only when an existing supported Coordinate can be
changed safely. It updates requested `x` or `y` values in place, never creates
missing structures, and returns a status with the original Dataset on refusal.

---

# EntityService

The EntityService manages Entity objects.

## Responsibilities

- Create Entities
- Delete Entities
- Update Entity properties

## Functions

### addEntity()

Creates a new Entity with a UUID v7 identifier and returns the updated Dataset
and generated Entity ID. Entity names are not required to be unique.

Returns:

- an updated Dataset and the new Entity ID

---

### deleteEntity()

Returns:

- an updated Dataset

---

### updateName()

Returns:

- an updated Dataset

---

### updateDescription()

Returns:

- an updated Dataset

---

# IdentifierService

The IdentifierService generates UUID v7 identifiers for new Datasets and Core
Objects.

Generated Core Object identifiers are checked against Event, Entity, and
Relation IDs in the current Dataset before use. Dataset identity is independent
from Core Object identifiers. Existing and imported identifiers are preserved.

---

# DatasetService

The DatasetService manages datasets.

## Responsibilities

- Create datasets
- Import datasets
- Migrate exact, fixture-backed NarrativeLine legacy profiles in memory
- Export datasets
- Update supported Metadata Extension fields

## Functions

### createDataset()

Creates an in-memory Dataset with:

- the top-level Core `version`
- a UUID v7 `extensions.metadata.datasetId`
- empty Event, Entity, and Relation collections

The optional `extensions.metadata.title` is omitted until a user assigns one.
No History Extension or common Extension version wrapper is added merely
because NarrativeLine supports History editing.

Returns:

- the new Dataset

---

### importDatasetJson()

Parses a JSON string, applies an exact recognized legacy migration when
necessary, and validates the resulting E2R Dataset.

Returns a distinct `json_parse_error` for malformed JSON. For valid JSON
syntax, it returns migration and Validator issues or the loaded Dataset. A
successful legacy migration adds `legacy_dataset_migrated`, identifies the
matched profile, and retains the original source string in the import result.
Invalid or conflicting legacy dates fail explicitly rather than being guessed.

Importing does not assign or regenerate `extensions.metadata.datasetId` merely
because the field is absent. File selection and reading are UI responsibilities
that will call this function. Opening never overwrites the selected file;
export uses the current representation.

`LegacyDatasetService` owns profile recognition and pure in-memory conversion.
The supported profiles and append-only compatibility policy are documented in
`legacy-dataset-compatibility.md`.

Returns:

- a validation result containing the loaded Dataset only after successful
  validation

---

### exportDatasetJson()

Validates the current Dataset, prepares application-owned output metadata, and
serializes the prepared Dataset as formatted JSON.

When Metadata or History is present and every used Extension has an exact
version known to NarrativeLine, export adds a complete Specification Extension
draft `0.1.0` declaration. Current supported declarations are Metadata
`1.0.0`, History `1.0.0`, and Coordinate `0.1.0`. An existing Specification
Extension is preserved. If an unknown or unsupported Extension is present,
export does not create a partial declaration or guess its version.

The prepared export value is validated again. Declaration preparation does not
modify the in-memory Dataset or application state.

The function returns Core validation issues when the Dataset is invalid and a
distinct `json_serialize_error` when it cannot be represented as JSON. It
returns JSON only after successful validation.

---

### mergeFile() (Future)

Merges another dataset into the current dataset.

Returns:

- an updated Dataset

---

### addFile() (Future)

Adds an additional dataset.

Returns:

- an updated collection of open Datasets

---

### updateMetadataTitle() (Future)

Returns:

- an updated Dataset

---

# SpecificationDeclarationService

The SpecificationDeclarationService prepares exact, complete specification
version declarations for newly exported NarrativeLine output.

It scans Extension occurrences at Dataset, Entity, Event, and Relation scope.
It returns a new Dataset only when all declarations can be made exactly. It
leaves the Dataset unchanged when no NarrativeLine-owned Metadata or History
output is present, when a declaration already exists, or when any Extension
version is unknown or unsupported.

---

# ValidationService

The ValidationService validates the E2R Core structure independently of the
user interface.

## Responsibilities

- Validate the required Dataset fields and their value types
- Validate non-empty, Dataset-wide unique Core Object identifiers
- Validate Relation `sourceId` and `targetId` fields
- Resolve Relation endpoints to an Entity or Event in the same Dataset
- Report stable error codes, JSON Pointer paths, and related identifiers
- Allow unknown Core fields and unknown Extensions

## Functions

### validateCoreDataset()

Accepts an unknown parsed JSON value and returns a result containing:

- `isValid`
- `issues`
- the typed Dataset when the value is valid

Each issue has a stable `code` and JSON Pointer `path`. Issues involving an
identifier include `relatedIds`.

Core validation does not interpret or reject unknown fields or Extensions.
Supported Extension validation is a separate responsibility.

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

### entityPicker()

Updates:

- currentScreen

---

### entityDetail()

Updates:

- currentScreen

---

# DialogService (Future)

The current Event deletion confirmation is local Event Detail UI state. A
shared DialogService remains a future option for dialogs that require shared
application state.

## Responsibilities

- Open dialogs
- Close dialogs

## Functions

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

App owns the React state. Services own operation logic and return the next value
for App to apply.

| State | React owner | Operation logic |
|-------|-------------|-----------------|
| Dataset state | App | EventService, EntityService, DatasetService |
| currentScreen | App | NavigationService |
| currentDialog | App | DialogService |
| selectedEvent | App | SelectionService |
| selectedEntity | App | SelectionService |

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
- PluginService

The current architecture is designed so that new Services can be added without changing the responsibilities of existing Services.
