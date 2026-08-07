# NarrativeLine User Guide

NarrativeLine is an application for editing E2R Datasets as a timeline of Events.

For an introduction to E2R, see the [E2R Overview](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/e2r-overview-en.md).

## Starting a Dataset

From the Home screen you can create a Dataset, import E2R JSON, open the sample Dataset, or resume the Dataset you were editing.

## Importing a Dataset

Choose an E2R JSON file with **Import E2R JSON**. Valid files open in the Timeline. Syntax and Core validation errors stop the import. Unknown Extensions produce warnings but do not prevent opening the Dataset.

## Dataset title

Enter a title at the top of the Timeline and choose **Apply title**. The title is stored in `extensions.metadata.title`.

## Editing Events

Select an Event on the Timeline and choose **Edit**. You can edit its name, description, and date.

## Associating Entities

From Event Detail, choose an Entity or use **Add Related Entity** to create one. The required Relation is created automatically.

## Exporting a Dataset

Choose **Export E2R JSON**. A title is used for the filename; without a title, the fallback is `e2r-dataset.e2r.json`.

## Validation messages

Errors prevent a Dataset from opening. Warnings allow it to open but should be reviewed. Diagnostics include a stable code and a JSON Pointer location.
