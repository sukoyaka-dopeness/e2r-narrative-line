# NarrativeLine

NarrativeLine is a timeline editor built on top of the E2R (Entity, Event, Relation) specification.

It serves two purposes:

- A practical timeline editor for E2R datasets.
- The primary reference application for validating the E2R Core and the History Extension.

NarrativeLine is developed alongside the E2R specification.

Practical implementation continuously provides feedback that helps improve the specification by identifying missing abstractions, unnecessary complexity, and opportunities to simplify the Core.

---

## Goals

NarrativeLine aims to:

- Create and edit E2R datasets.
- Visualize Events on a timeline.
- Provide an intuitive editing workflow.
- Validate the E2R Core through real-world usage.
- Validate the History Extension through practical implementation.
- Provide a second interpreter and bounded writer experiment for the
  experimental Coordinate interoperability prototype.

NarrativeLine intentionally focuses on timeline editing.

Graph editing, semantic modeling, and other specialized tasks are expected to be handled by separate E2R applications.

---

## Project Status

NarrativeLine is currently under active development.

The first milestone is a Minimum Viable Product (MVP) focused on the essential timeline editing workflow.

---

## MVP Scope

The MVP includes:

- Create a new dataset.
- Open an onboarding sample dataset.
- Create, edit, and delete Events.
- Associate Entities with Events.
- Automatic Relation creation between Events and Entities.
- Timeline visualization.
- Save and load E2R datasets.
- Validation during dataset loading.
- Navigate from Events to related Entities.
- Relation-based Entity lookup.

The MVP intentionally excludes:

- Entity-to-Entity Relation editing.
- Relative temporal relationships.
- Timeline filtering.
- Timeline search.
- Multiple timeline views.
- Collaboration features.

Post-MVP interoperability work additionally reads Coordinate prototype
`0.1.0`. Entity and Event Detail display Dataset-defined logical Coordinates;
an object with multiple Coordinates provides a temporary Space selector.
Entity Detail can explicitly update only existing `x` and `y` values in the
exact `linkscape-graph` legacy Space or the canonical `liaisonscape-graph` Space. It does not create Spaces,
Components, or Coordinates, and all other Coordinate data remains read-only.
The selected Space is not saved to the Dataset.

See `docs/MVP.md` for the complete MVP definition.
Post-MVP product priorities and their specification-discussion boundaries are
tracked in `docs/priority-feature-backlog.md`.

NarrativeLine also has an append-only, fixture-backed compatibility path for
formats produced by earlier NarrativeLine versions. The first supported
profile migrates the former Event-level `date` string to History Extension
time fields during import without overwriting the source file. See
`docs/legacy-dataset-compatibility.md` for the recognition and preservation
rules.

---

## Relationship to E2R

NarrativeLine is designed together with E2R rather than after it.

Implementation experience feeds back into the specification.

This iterative process helps refine:

- Core responsibilities.
- Extension boundaries.
- Application responsibilities.
- Editing workflows.
- Interoperability.

The specification and the application are expected to evolve together.

---

## Repository Structure

```
docs/
    MVP.md

src/

public/
```

Additional documentation will be added as the project evolves.

---

## Related Projects

- E2R Specification
- LiaisonScape (relationship explorer)

NarrativeLine focuses on timeline editing.

LiaisonScape will provide graph-based visualization and editing of the same E2R dataset.

Both applications are intended to interoperate through the shared E2R data model.

---

## License

This project is released under the MIT License.

---

## Long-term Vision

NarrativeLine is expected to become one application within the future E2R Studio ecosystem.

Different applications will provide different views and editing workflows while sharing the same E2R dataset.

Examples include:

- NarrativeLine (timeline editor)
- LiaisonScape (relationship graph)
- Dataset Explorer
- Extension Editor
- LLM-assisted editing tools

The long-term goal is to enable multiple interoperable applications built on the same open data model.
