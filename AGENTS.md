# NarrativeLine Development Guidance

## Repository Purpose

NarrativeLine is a timeline editor built on the E2R specification.

It has two primary purposes:

* Provide a practical timeline editor for E2R Datasets.
* Serve as a reference implementation for validating the E2R Core and History Extension.

NarrativeLine is not a general-purpose JSON editor, graph editor, or semantic modeling application.

## Related Repository

The related E2R specification repository is expected to be available beside this repository:

* `../e2r-spec`

Before making changes to the data model, validation, History Extension handling, or architectural boundaries, read the relevant specification files in that repository.

Important specification documents include:

* `../e2r-spec/spec/core.md`
* `../e2r-spec/spec/philosophy.md`
* `../e2r-spec/spec/rationale.md`
* `../e2r-spec/extensions/history-extension.md`
* `../e2r-spec/docs/application-design-principles.md`
* `../e2r-spec/docs/application-recommendations.md`

If the sibling repository is unavailable, report that limitation instead of guessing the specification.

## Required NarrativeLine Reading

Before making architectural or workflow changes, read the relevant documents, especially:

* `README.md`
* `docs/MVP.md`
* `docs/architecture.md`
* `docs/navigation.md`
* `docs/state.md`
* `docs/state-machine.md`
* `docs/services.md`
* `docs/editing-model.md`

Inspect the current implementation before assuming that documentation and code are synchronized.

## Product Boundaries

* NarrativeLine focuses on timeline editing.
* Keep features within the current MVP unless explicitly instructed otherwise.
* Graph editing belongs to a separate E2R application.
* Do not turn NarrativeLine into a generic E2R structure editor.
* Preserve compatibility with the E2R specification.
* Application behavior must not silently redefine the E2R Core.

## Current Data Model

The current application model includes:

* `Dataset`
* `Event`
* `Entity`
* `Relation`

Before changing these types, compare the proposed change with the current E2R specification.

## Interface Principles

* Timeline selection and Event editing are separate actions.
* Clicking a Timeline item selects it.
* Editing is entered through an explicit edit control.
* Timeline entries should remain compact and readable as a timeline.
* Event Detail is used for Event editing.
* Entity Detail shows Entity information and related Events.
* Destructive actions should not be placed where accidental activation is likely.

## Implementation Method

Before editing:

1. Read the relevant source files and documentation.
2. Explain which file will be changed first.
3. Identify any additional files that may eventually require changes.
4. Do not begin with broad multi-file rewriting when a smaller change is possible.

While editing:

* Change one file at a time.
* Keep the project compilable after each completed file change.
* Run the relevant check before moving to the next file.
* Preserve existing working behavior unless the task requires changing it.
* Avoid unnecessary abstractions and dependencies.
* Do not modify unrelated files.
* Do not commit or push changes unless explicitly instructed.

## Validation

After code changes, run the available checks, normally including:

```text
npm run build
```

Also run lint or tests when they are available and relevant.

Do not claim that a change works unless the relevant check has completed successfully.

## Completion Criteria

A development task is complete when:

* The requested behavior is implemented.
* TypeScript compilation succeeds.
* The production build succeeds.
* The implementation follows the documented architecture.
* The implementation remains compatible with E2R.
* The final diff contains no unrelated changes.
