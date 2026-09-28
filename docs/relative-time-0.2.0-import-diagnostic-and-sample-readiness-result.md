# Relative Time 0.2.0 Import Diagnostic and Sample Readiness Result

Date: 2026-09-28

Status: **CURRENT EXACT-VERSION SUPPORT VERIFIED / HUMAN BROWSER WARNING REPORTED, DIAGNOSTIC AND CAUSE UNRESOLVED / CANDIDATE SAMPLE DRAFT ONLY**

## Browser/runtime parity follow-up — 2026-09-28

Human reports that opening both Lantern Market drafts in a real browser shows
NarrativeLine's `読み込み情報`; opening the Core-only replacement-safety
fixture does not. The supplied browser evidence does not include the warning's
diagnostic code, path, or message. The earlier `specification_version_unsupported`
observation from another Dataset is not evidence that either Lantern Market
draft emitted that diagnostic.

The currently available Edge tab is `http://127.0.0.1:5173/e2r-narrative-line/`
and displays the one-Event Core-only fixture without import information. Its
Vite dev process was started on 2026-09-19 from this repository. The tab does
not retain either Lantern Market import, so it cannot establish which warning
Human saw or which app state/revision emitted it. The current workspace serves
the Vite source entry at that URL; the current production build was regenerated
on 2026-09-28 as `dist/assets/index-xsrFFke0.js`. The long-lived dev process
alone does not prove that Human used a stale application revision.

The current Edge page exposes `/e2r-narrative-line/@vite/client` and
`/e2r-narrative-line/src/main.tsx`; its browser console recorded Vite connected
at `2026-09-28T04:19:04Z`. It is a live Vite development page, not the production
bundle. The current Vite-transformed `ValidationService.ts` imports
`/e2r-narrative-line/node_modules/.vite/deps/@sukoyaka-dopeness_e2r-validator.js?v=5bbf2261`.
That local browser prebundle was generated on 2026-09-28, is 97,301 bytes, and
has SHA-256
`EE531EDFB1D5CBA438AFA879930244597FE440D44372028F78C1FEEF63EC10B6`.
It contains exact Relative Time `0.2.0` and `relative-position` support. The
separate current production asset is
`dist/assets/index-xsrFFke0.js` (SHA-256
`8EBEFA526F5E2FAC71FD1F27E8B454A1AD7226E0C0D5D695209246D52E31EFC9`); the
visible Edge page does not load that asset. The dev page exposes no Git commit
identifier; its URL and entry identify a Vite source runtime, while the exact
revision that emitted Human's warning remains unknown.

The Core-only control is visibly open in the current Edge page and has no
`読み込み情報`. Lantern Market EN/JA were not reopened in this attempt: the
browser upload bridge rejected the local-file chooser because Edge's ChatGPT
extension does not currently have local-file access. Human approved enabling
`Allow access to file URLs`, but the browser control policy blocked navigation
to `edge://extensions/`. No alternate route was attempted and no extension
setting changed. The next concrete action is for Human to enable that setting
manually or provide the exact diagnostic and app URL from a fresh import.

Current `package.json`, lockfile, installed package, and Vite prebundle resolve
Validator `0.7.0`; exact Relative Time `0.2.0` / `relative-position` support is
present. The current NarrativeLine import pipeline preserves Validator warning
diagnostics and shows only returned warning-severity issues under `読み込み情報`.
Current import-service and production-App file-input integration evidence
imports the Core-only fixture and Lantern Market EN/JA with no warnings or
errors. No current source defect has been demonstrated, but there is not enough
evidence to attribute the Human-observed warning to a stale build, a different
import route, a dependency/prebundle difference, or an input/declaration
difference. The warning remains unclassified, not ruled out. No warning was
filtered, and no sample, version, or Extension declaration was changed.

The remaining diagnostic input is the exact warning code/path/message for each
Lantern Market draft and the app URL used when it appeared. Until those values
are available, browser/runtime parity remains unresolved and Formal Human
Acceptance must not be reported as complete.

### Acceptance automation added

The existing app-local test infrastructure now also verifies:

- the production React App's Timeline file-input handler and normal import
  service leave no import-warning or import-error panel for the Core-only
  fixture and Lantern Market EN/JA;
- accepted replacement after a dirty Perspective move uses the warning-free
  Core-only fixture, passes through the existing replacement guard, and does
  not carry the prior Perspective payload into the replacement Dataset;
- repeated adjacent move operations preserve the sparse sequence and expose
  disabled first/last controls while focus remains on a native button;
- adding, editing, and deleting Relative Time Relations does not rewrite the
  authored Perspective sequence; and
- a Relative Time cycle remains represented as a Relative Time conflict while
  Perspective and recorded Relations remain unchanged.

These tests exercise the production App/import handlers with a synthetic
File-like object in the existing Vite/jsdom harness. The App integration uses
Vite's `ssrLoadModule`; it exercises the import handler but does not load the
page's browser-optimized Validator prebundle or retain a real browser page
between builds. This is why it could not detect a possible browser-only or
long-lived-page discrepancy. The tests do not exercise the OS file chooser,
real browser download, or a Human-observed browser warning. No new browser test
was added: the available Vite/jsdom layer repeats the same SSR/runtime boundary,
while a maintained real-browser test runner would be a separate infrastructure
addition outside this bounded checkpoint.

The Perspective service and Timeline integration suites cover sparse
authoring, clean read/projection, dirty baseline, export/re-import, Core Event
array preservation, Relative Time band composition, dated/undated interleave,
History/`temporalOrder` non-mutation, Event add/rename/delete lifecycle,
dangling-reference preservation, multiple/unsupported Perspective safety,
replacement cancellation/acceptance, and native-button focus/move boundaries.
Formal Human review remains for rendered visual density and control hierarchy,
placed/unplaced label density, same-name Event distinguishability, localized
move feedback and diagnostic comprehension, narrow viewport appearance, actual
focus appearance and interaction feel, whether a warning needs an explicit
export confirmation, and one real-file open/export/re-open smoke.

## Prior checkpoint diagnostic investigation — 2026-09-28

At this checkpoint NarrativeLine's `package.json` and lockfile pin
`@sukoyaka-dopeness/e2r-validator` `0.7.0`; the lockfile resolves the normal
npm package tarball. The installed package also reports `0.7.0`. Its source
contains exact Relative Time `0.2.0` and `relative-position` support in the
Specification declaration support registry and the Relative Time validation
path. NarrativeLine's `ValidationService` forwards Validator diagnostics
unchanged, and the import path returns those diagnostics; no application filter
or warning suppression is involved. The current Vite dependency prebundle and
a fresh production build include the `0.2.0` support table.

The reported code and path are produced when the Specification Extension's
declaration interpretation does not find the declared exact version in local
support. Under the current `0.7.0` Validator, a declaration for
`draft.github.sukoyaka-dopeness.relative-time` at exact `0.2.0` is supported.
The existing `RelativeTime02Consumer` test imports the E2R-SPEC all-families
`0.2.0` Dataset with no issues. The new English and Japanese candidate
Datasets below also import with no issues through NarrativeLine's normal
Dataset import service.

The Human-reported browser Dataset and the exact app origin/build that emitted
the warning were not available in this repository. The warning was not
reproduced against current package/source evidence, so no current source defect
has been established and no code or declaration was changed. The original
observation's precise cause remains unconfirmed: the available evidence cannot
distinguish an earlier/stale runtime from an input declaration that differs
from the exact current `0.2.0` contract. If the warning recurs, its source
Dataset and exact app URL/build are required to identify which differs.

## Acceptance Dataset and sample draft

- [`tests/fixtures/dataset-replacement-safety-warning-free.e2r.json`](../tests/fixtures/dataset-replacement-safety-warning-free.e2r.json) is a small Core-only Dataset with one Event, no Extensions, and no special diagnostics. Normal NarrativeLine import returns no issues. It is an application acceptance fixture, not a public sample.
- The [Lantern Market English/Japanese sample draft](../../e2r-spec/docs/sample-drafts/relative-time-0.2.0-lantern-market-candidate.md) is a fictional evening market outage: the outage precedes both lantern setup and circuit isolation; those two Events are unordered relative to one another; both precede reopening. Three Entities, four undated Events, four exact Relative Time `0.2.0` `relative-position` Relations, and seven ordinary Event/Entity Relations keep it legible as a Timeline and small graph. It contains no History or Perspective data.

The sample Dataset imports through NarrativeLine with no issues in both
languages. The supplementary Relative Time view projects three bands and the
middle unordered pair. Event Detail exposes the recorded assertions. Dataset
export followed by NarrativeLine import preserves the full payload and
declaration unchanged; opening, exporting, and re-importing adds no History or
Perspective payload.

The sample remains an AI-assisted fictional draft awaiting Human content and
localization review. No license or redistribution bucket is asserted. It has
not been added to NarrativeLine's built-in sample catalog, an E2R Hub registry,
or the public Sample Gallery. Future public inclusion requires separate
provenance/rights review and Human adoption.

## Verification and limits

- Focused import/projection/Event Detail/export-reimport tests: **3/3 PASS**.
- NarrativeLine complete test suite: **304/304 PASS**; lint: **PASS**; build:
  **PASS**.
- E2R-SPEC `npm run validate`: **PASS**.
- `git diff --check`: **PASS** in the changed repositories.
- A fresh isolated local NarrativeLine page loaded, but the browser automation
  bridge rejected setting a local file on its file chooser (`Not allowed`).
  Therefore a real-browser import/download/re-import was not completed in this
  checkpoint. The committed automated integration evidence exercises the
  production import service and rendered Timeline/Relative Time/Event Detail
  components. Formal Perspective Real Browser / Human Acceptance remains the
  next separate checkpoint.

No runtime fix, package release, Specification/Candidate change, public sample
promotion, Hub change, deployment, or public write was made.
