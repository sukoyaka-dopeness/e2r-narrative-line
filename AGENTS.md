# NarrativeLine Development Guidance

## Reusable knowledge

The central workspace knowledge base is `C:\Users\extra\E2R\ai-knowledge`.
Before navigation, Dataset safety, History, recovery, or Coordinate work,
search its `INDEX.md` using task terms. Read only entries whose `scope` matches
NarrativeLine or explicitly includes the workspace. Treat hypotheses as review
prompts, not accepted implementation rules.

## Repository Purpose

NarrativeLine is a timeline editor built on the E2R specification.

It has two primary purposes:

* Provide a practical timeline editor for E2R Datasets.
* Serve as a reference implementation for validating the E2R Core and History Extension.

NarrativeLine is not a general-purpose JSON editor, graph editor, or semantic modeling application.

## Related Repository

The related E2R specification repository is expected to be available beside this repository:

* `../e2r-spec`

When a task changes the data model, validation, History Extension handling, or
architectural boundaries, read the relevant specification source of truth in
that repository. The main references are:

* `../e2r-spec/spec/core.md`
* `../e2r-spec/spec/philosophy.md`
* `../e2r-spec/spec/rationale.md`
* `../e2r-spec/extensions/history-extension.md`
* `../e2r-spec/docs/application-design-principles.md`
* `../e2r-spec/docs/application-recommendations.md`

If the sibling repository is unavailable for a task that depends on it, report
that limitation instead of guessing the specification.

## Topic-based NarrativeLine Reading

For architectural or workflow work, select the documents relevant to the
actual topic and change scope:

* `README.md`
* `docs/MVP.md`
* `docs/architecture.md`
* `docs/navigation.md`
* `docs/state.md`
* `docs/state-machine.md`
* `docs/services.md`
* `docs/editing-model.md`

Inspect the current implementation before assuming that documentation and code
are synchronized. Documentation-only or narrowly scoped guidance changes do
not require reading unrelated product documents.

## Product Boundaries

* NarrativeLine focuses on timeline editing.
* Keep features within the current MVP unless explicitly instructed otherwise.
* Graph editing belongs to a separate E2R application.
* Do not turn NarrativeLine into a generic E2R structure editor.
* Preserve compatibility with the E2R specification.
* Application behavior must not silently redefine the E2R Core.

## Application modularization policy

Apply the workspace Decision in
`ai-knowledge/decisions/application-modularization-and-incremental-extraction.md`.
Use responsibility-based, incremental extraction when new work would enlarge
a root or controller component. Do not rewrite the application wholesale,
split files mechanically, or treat a file-count target as an architectural
requirement; preserve accepted Dataset and interaction behavior.

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

## Working Method

Choose source tracing, investigation order, implementation shape, and
focused validation from the objective and diff scope. Keep intermediate states
safe and compilable when making runtime changes, preserve existing behavior
unless the task requires otherwise, avoid unnecessary abstractions, and do not
modify unrelated files. Stop and report when an important architecture or
authority decision cannot be made safely from current evidence.

Research promoted toward a production candidate must retain executable
provenance sufficient to replay normalized input through current-source
execution to the reviewed result: relevant entry point, source revision,
fixture/input identity, parameters and determinism conditions, generation
method, and output parity evidence.

A verified local commit is allowed for one bounded logical checkpoint of
explicitly requested work. Do not push, publish, or rewrite history without
explicit authorization.

## Git Checkpoint Policy

Codex may create local commits for one bounded logical checkpoint when it is
complete and verified. Before committing, inspect `git status --short`, stage
only exact owned paths or hunks, inspect `git diff --cached --name-status`, run
`git diff --cached --check`, and complete validation proportional to the
change. Substantive runtime or application changes normally use the relevant
NarrativeLine gates: `npm test`, `npm run lint`, and `npm run build`.
Documentation-only or narrow non-runtime changes still require appropriate
focused validation and may use `git diff --cached --check` plus applicable
documentation/configuration checks.

After committing, report the hash, subject, scope, verification results,
worktree status, and unpushed status. Preserve unrelated dirty work.

Do not use the following unless the user explicitly authorizes that exact
operation:

- `git add .`
- `git add -A`
- `git commit -a`
- `git reset --hard`
- `git clean`
- broad `git restore`
- broad or automatic `git stash`
- rebase
- squash
- amend of an existing checkpoint
- history rewriting
- force push

Prefer exact-path staging such as:

`git add -- path/to/file1 path/to/file2`

or precise hunk staging when required. Push, release, deployment, and
publication always require explicit authorization.

## Validation

Select validation proportional to the change. Substantive runtime or
application changes normally use the available NarrativeLine gates (`npm test`,
`npm run lint`, and `npm run build`) when relevant. Documentation-only and
narrow non-runtime changes may use focused checks, Markdown/config validation,
or `git diff --check`; do not claim runtime behavior was validated when it was
not exercised.

## Completion Criteria

A development task is complete when:

* The requested work is complete.
* Validation appropriate to the change scope succeeds.
* When runtime or application code changes, the relevant TypeScript, build, and
  test gates succeed.
* The implementation follows the documented architecture.
* The implementation remains compatible with E2R.
* The final diff contains no unrelated changes.
