# Relative Time 0.2.0 Import Diagnostic and Sample Readiness Result

Date: 2026-09-28

Status: **CURRENT EXACT-VERSION SUPPORT VERIFIED / REPORTED BROWSER WARNING NOT REPRODUCED / CANDIDATE SAMPLE DRAFT ONLY**

## Diagnostic investigation

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
