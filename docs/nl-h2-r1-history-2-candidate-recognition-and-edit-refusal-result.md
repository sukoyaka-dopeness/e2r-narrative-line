# NL-H2-R1 — History 2.0 Candidate Recognition and Edit Refusal

Date: 2026-09-19
Status: **ACCEPTED / MANUAL ACCEPTANCE COMPLETE**

## Scope and authority

This bounded checkpoint implements the application boundary selected by the
History 2.0.0 Candidate / Relative Time readiness audit. The authoritative
runtime change is NarrativeLine commit `1c1d068` on `main`. The normative
History and Relative Time candidate documents remain owned by `e2r-spec`; this
checkpoint does not promote either candidate, change the Dataset schema, or
implement semantic editing.

The accepted published dependency is
`@sukoyaka-dopeness/e2r-validator@0.5.0`, resolved from the NarrativeLine
lockfile. Validator source and release artifacts were not changed.

## Implemented boundary

`HistoryCapabilityService` classifies Event-owned History data into the bounded
application capabilities:

- no History;
- stable History `1.0.0` / the existing `time` shape;
- the exact supported History `2.0.0` Candidate declaration and assertion
  shape;
- unsupported, unknown, or mixed History shapes.

Stable History keeps its existing date/time editor, presentation, sorting, and
export behavior. Candidate, unknown, unsupported, and mixed shapes are opened
read-only for History purposes. NarrativeLine does not display a candidate
midpoint, infer a date, infer `temporalOrder`, reorder the Timeline, or write a
Derived fact. The History editor is omitted and the user receives localized
EN/JA read-only guidance.

Unrelated Event edits continue through the existing mutation path. Candidate
History fields, exact declarations, unknown fields, and Relative Time Relation
payloads remain preserved on unrelated edit/export round trips. Direct Stable
History writes also refuse candidate, unknown, unsupported, and mixed shapes.
An undeclared candidate-shaped payload is not given a false
`history: 1.0.0` declaration, and NarrativeLine does not invent a `2.0.0`
declaration.

## Explicitly outside this checkpoint

- History 2 semantic presentation or authoring;
- bounded-point and temporal-extent editing;
- History 1 to History 2 migration;
- Relative Time ordering, authoring, solving, diagnostics, or Derived writeback;
- Temporal Frame, calendar, Time Zone, UTC offset, Instant, and other
  specification research;
- Dataset/Core/Extension schema changes, sample changes, and Validator changes.

## Validation

The following gates passed after `npm ci --ignore-scripts`:

- `npm test`: **232 pass, 0 fail**, natural completion;
- `npm run lint`: **PASS**;
- `npm run build`: **PASS**;
- `git diff --check`: **PASS**;
- installed Validator package: **0.5.0**;
- focused History boundary and production UI integration tests: **47/47 pass**.

The full test emits the existing Vite middleware warning that port `24678` is
already in use; it does not prevent natural test completion and no test
infrastructure change was made. `npm ci` also reported the package manager's
existing audit summary of two high-severity findings; dependency remediation is
outside this bounded History checkpoint and was not attempted.

The automated UI integration coverage verifies the read-only notice and the
absence of date inputs in English and Japanese, plus an unrelated name edit
and save.

## Real-browser manual acceptance

The previously blocked fixture-loading step was recovered without a production
change. Chrome `152.0.0.0` loaded the canonical
`e2r-spec/examples/history-2.0-draft/position.json` through CDP
`DOM.setFileInputFiles` on NarrativeLine's real `input[type=file]`. The file
therefore passed through the application's normal import, parsing, and
validation boundary; no React state or parsed Dataset was injected.

The resumed matrix passed on the exact documented revision:

- Stable History `1.0.0` opened with its six date/time number inputs, remained
  editable in EN and JA, saved a Year change, and reflected it on the Timeline.
- The exact History `2.0.0` Candidate opened normally in EN and JA with clear
  read-only guidance, no number inputs, no Stable time field group, and no
  add-time control.
- Tab and Shift+Tab reached the shell, Back, locale action, supported Event
  fields, and supported actions with visible focus. No hidden History editor
  entered the focus sequence. Enter activated Back successfully.
- At a 360 x 800 viewport the Japanese notice and supported fields fit without
  horizontal document overflow; brand, Back, and locale actions remained
  visible and usable.
- An unrelated Event Name edit saved successfully. A real browser export and
  file-input re-import preserved the Candidate History object and exact
  declaration, retained `history: 2.0.0`, and introduced neither `history.time`
  nor a false Stable declaration.
- A mixed `history.time` plus `history.assertions` fixture was refused by the
  Validator boundary with `history_2_time_and_assertions_conflict`; the active
  Candidate remained intact, no automatic repair occurred, and navigation
  remained usable. The existing focused tests retain coverage of the internal
  mixed-shape read-only capability classification.
- An unknown Candidate assertion member remained read-only and survived an
  unrelated Description edit plus export. An unsupported declared History
  version also remained read-only and usable, without a blank/error loop.

No Candidate assertion rewrite, History declaration invention, Stable fallback,
blank screen, navigation lock, visible data loss, Relative Time ordering, or
Derived writeback was observed. Human inspection of the EN desktop and JA
360 px screenshots confirmed that the bounded read-only presentation is
understandable and fits its surface. No runtime defect was found.

## Worktree and release boundary

The implementation commit changes only the History capability boundary, its
localized notice/style, and focused tests. This acceptance closure changes
documentation only. The pre-existing dirty
`AGENTS.md` was not staged or changed by this checkpoint. No schema, sample,
Validator, LiaisonScape, release artifact, tag, push, deploy, or publication
was performed.
