# NarrativeLine User Guide

NarrativeLine is an application for editing E2R Datasets as a timeline of Events.

For an introduction to E2R, see the [E2R Overview](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/e2r-overview-en.md).

## Terms used in this guide

- Dataset: the data for one timeline, including its Events, Entities, and Relations
- Event: an occurrence or activity at a point in time or over a period, displayed on the Timeline
- Entity: a person, organization, place, object, or other existence involved in an Event. For example, an Event named “Moon landing” might be related to astronauts, NASA, and the Moon.
- Association: a connection between an Event and an Entity. It records who, what organization, or what place is involved in the Event.
- Extension: additional information, such as dates and a title, that can be added to the basic E2R data

## Starting a Dataset

From the Home screen you can create a Dataset, import E2R JSON, open the sample Dataset, or resume the Dataset you were editing.

## Importing a Dataset

Choose an E2R JSON file with **Import E2R JSON**. Valid files open in the Timeline. Syntax and Core validation errors stop the import. Unknown Extensions produce warnings but do not prevent opening the Dataset.

## Dataset title

To name the timeline you are creating, enter a title at the top of the Timeline and choose **Apply title**. The title is recorded as extension data in the Dataset and is included in exported JSON files.

Technical note: the storage location is `extensions.metadata.title`.

## Editing Events

Select an Event on the Timeline and choose **Edit**. You can edit its name, description, and Gregorian calendar date. **Save Event** returns to the Timeline. **Save and Add Related Entity** saves valid edits and opens the Entity Picker.

## Screen navigation

NarrativeLine uses the Timeline as its central workspace.

```text
Home
  ↓ Open a Dataset
Timeline
  ↓ Add or edit an Event
Event Detail
  ├─ Save → Timeline
  ├─ Edit a related Entity → Entity Detail
  │                            └─ Save or Back → originating Event Detail
  └─ Save and Add Related Entity → Entity Picker
                                      ├─ Associate an existing Entity → Event Detail
                                      └─ Create New Entity
                                           ├─ Create and Associate → Event Detail
                                           └─ Back → Entity Picker
```

Working screens place **Back** on the left side of the bottom action bar and their save or creation actions on the right. Delete actions remain separate from this primary action group.

## Associating Entities

From Event Detail, choose **Save and Add Related Entity**. The Entity Picker lists existing Entities separately from new Entity creation.

- Choose **Add Entity** to associate an existing Entity.
- Choose **Create New Entity** to open a separate creation screen.
- Enter a name and optional description, then choose **Create and Associate**.
- Entities may share the same name and are not merged automatically by name.

The required Relation is created automatically.

## Editing Entities

Select a related Entity in Event Detail and choose **Edit Entity**. Saving or going back returns to the originating Event Detail and restores the related Entity context.

Removing an association does not delete the Entity. Entity deletion is a separate destructive action in Entity Detail.

## Exporting a Dataset

Choose **Export E2R JSON**. A title is used for the filename; without a title, the fallback is `e2r-dataset.e2r.json`.

## Validation messages

Errors prevent a Dataset from opening. Warnings allow it to open but should be reviewed. Diagnostics include a stable code and a JSON Pointer location.
