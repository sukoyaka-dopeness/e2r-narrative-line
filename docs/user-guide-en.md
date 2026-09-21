# NarrativeLine User Guide

NarrativeLine is an application for editing E2R Datasets as timelines of Events. This guide is organized around common tasks rather than screen names.

For an introduction to E2R, see the [E2R Overview](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/e2r-overview-en.md).

## What can you do with NarrativeLine?

You can use NarrativeLine to:

- view a Dataset as a Timeline;
- create and edit Events;
- connect Events with related Entities;
- record dates and optional times; and
- save the result as an E2R JSON Dataset for use in another E2R application.

An Entity is a person, organization, place, work, object, or other thing
involved in an Event. For example, the astronauts and NASA can be connected
to an Event named “Apollo 11 Moon landing.”

## View a Timeline

From Home, choose **Open Sample Dataset** to explore the built-in sample, or choose **Resume Editing** to return to the Dataset you were editing. The Timeline is the main workspace for selecting Events and opening their details.

The Timeline toolbar stays available while you work. Choose **Add Event** to
create a new Event. When the page is long, **↑ Top** and **↓ Bottom** provide
quick navigation. The **More** menu contains **Open E2R Dataset** for opening
another local file and **Export E2R JSON** for saving the current Dataset;
opening replaces the current Dataset only after the replacement-safety checks,
whereas export downloads a copy and keeps the current workspace open.

```text
Home
  ↓ Open a Dataset
Timeline
  ↓ Select or add an Event
Event Detail
  ├─ Save → Timeline
  ├─ Edit a related Entity → Entity Detail → Save or Back → Event Detail
  └─ Save and Add Related Entity → Entity Picker
                                      ├─ Add an existing Entity → Event Detail
                                      └─ Create New Entity → Event Detail
```

## Create or edit Events

From the Timeline, select an Event and choose **Edit**, or choose the action to add an Event. Enter its name, description, and Gregorian calendar date. Open **Add time (optional)** to enter hour, minute, and second. A time is saved only when a date is recorded; if you clear part of the time, more detailed time information is cleared with it. **Save Event** returns to the Timeline.

## Connect an Event to an Entity

From Event Detail, choose **Save and Add Related Entity**.

- Choose **Add Entity** to connect an existing Entity.
- Choose **Create New Entity** to enter a name and optional description.
- Choose **Create and Associate** to create and connect the new Entity.

Entities may share the same name; NarrativeLine does not merge them automatically. The required Relation is created automatically. Editing or removing an association does not delete the Entity. Entity deletion is a separate action in Entity Detail.

## Use your own Dataset

From Home, choose **New Dataset** to start from an empty Dataset, or choose **Open E2R Dataset** to import an E2R JSON file. Valid files open in the Timeline. Syntax and Core validation errors stop the import. Unknown Extensions produce warnings but do not prevent opening the Dataset.

Home also provides **Open Sample Dataset** and **Sample info**. The former opens
the built-in sample for the current application; the latter opens the central
E2R specification provenance record. The public Gallery has five ordinary
sample families. E2R Self-Description is a separate non-normative dogfood and
technical entry, not a sixth Gallery sample.

## Save or share a Dataset

To name the timeline, enter a title at the top of the Timeline and choose **Apply title**. The title is included in the exported JSON.

Choose **Export E2R JSON** to save the Dataset. A title is used for the filename; without a title, the fallback is `e2r-dataset.e2r.json`.

Before export, NarrativeLine validates the Dataset. The exported file keeps the information needed to open and edit the Dataset in another compatible E2R application.

The language control in the Header shows the current language and lets you
switch between English and Japanese. The Header Home link returns to Home, and
the bottom **Back** action returns to the previous workspace in detail and
creation flows.

## Share a timeline with a link

Dataset Handoff lets you share a timeline you created as a link. You can
publish the link on social media or a website so other people can open and
explore the timeline without first downloading a JSON file and importing it
manually. NarrativeLine does not host the Dataset or post to social media;
the Dataset must already be available at a public HTTPS URL.

When someone opens the link, NarrativeLine obtains the published Dataset at
startup and opens it in the Timeline.

### Requirements for creating a Handoff link

The link has this form:

```text
https://example.org/narrativeline/#datasetUrl=https%3A%2F%2Fexample.org%2Fhistory.e2r.json
```

The Dataset URL must be an absolute public `https://` URL, and its host must allow browser requests from NarrativeLine (CORS). Private or authentication-required URLs are not supported by Dataset Handoff v0.

Handoff runs at startup only. Changing the extra information at the end of
the URL later does not switch the active Dataset or start another remote
download.

If the Handoff link is invalid, or if Dataset acquisition, JSON parsing, or Dataset validation fails, NarrativeLine stays on Home and reports the failure. It does not silently open a sample or another Dataset. You can explicitly choose **Continue Editing**, **New Dataset**, **Open E2R Dataset**, or **Open Sample Dataset**.

Opening a Dataset from a Handoff link uses the same replacement protection as other Dataset-opening actions. If current work could be lost, NarrativeLine asks for confirmation before replacing it.

After a successful Handoff, the link remains in the address bar as a
reference to where the Dataset was obtained. In the technical representation
this is `datasetUrl`; it is not the Dataset's identity, does not represent
current unexported edits or screen state, and is not stored in the Dataset
JSON. Replacing the handed-off Dataset with a local Dataset, the sample, or a
new Dataset removes only that link reference and preserves unrelated URL
information.

## Technical details and validation

NarrativeLine uses the Timeline as its central workspace. Working screens
place **Back** on the left side of the bottom action bar and save or creation
actions on the right. Delete actions remain separate from this primary group.

For a History 2 Event with an exact Civil Time position, Event Detail can offer
**Mark the date and time as approximate**. Saving it keeps the entered date and
time and shows the approximation marker in the Timeline; it does not create a
range or midpoint. The marker describes the position as a whole, not a separate
time-only meaning. The public samples use the bounded
`history@2.0.0 / position-circa` Stable profile; the full `history@2.0.0`
extension remains Candidate, so this wording does not claim that every History
2 capability is Stable.

When an imported Dataset contains the experimental `linkscape-graph` Coordinate in an exact supported graph format, Entity Detail offers **Edit Recorded Coordinate**. It changes only the existing numeric `x` and `y` values. Other Spaces, missing values, and Event Coordinates remain read-only.

Errors prevent a Dataset from opening. Import information explains legacy migration and other non-blocking conditions. NarrativeLine converts its legacy Event date representation to the current History representation during import. The selected source file is not changed, and dates in a newly exported file use the current History representation. A legacy Dataset whose Extension specification versions are undeclared can still be read and edited. Exact diagnostic codes and JSON Pointer locations remain available under **Diagnostic details**.

On narrow screens, the Timeline remains usable with its responsive layout and
compact navigation controls. The same editing and export actions are available;
scroll the page to reach the workspace content and toolbar actions.

## Future possibilities

The following are ideas being considered for future NarrativeLine improvements. They are not promises about a current release or a fixed release schedule:

- organize the before-and-after relationships of Events whose dates are unknown;
- search the Timeline by Event name or description;
- filter the Timeline by conditions such as whether an Event has a date, making relevant Events easier to find;
- record more detailed times where useful;
- make existing connections easier to review and edit; and
- support safer experimentation with editing features such as Undo and Redo.

One possible improvement is to let users organize Events whose exact dates are
unknown. Even when the date is not known, it may be clear that one Event
happened before another, or that B happened after A. NarrativeLine could let
users record those relationships and reflect them in the Timeline.
