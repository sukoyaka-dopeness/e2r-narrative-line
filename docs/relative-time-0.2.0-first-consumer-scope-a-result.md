# Relative Time 0.2.0 First-Consumer Scope A Result

Date: 2026-09-26
Status: **LOCAL IMPLEMENTATION VERIFIED / BOUNDED READ-ONLY SUPPORT; NO APPLICATION RELEASE**

NarrativeLine now resolves the normally published
`@sukoyaka-dopeness/e2r-validator@0.7.0` through its exact package dependency
and lockfile. The E2R-SPEC [Relative Time 0.2.0 Draft](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/extensions/relative-time-0.2.0-draft.md)
remains the Candidate contract; `0.1.0` is a distinct unchanged exact version.
The [published Validator result](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/validator/validator-0.7.0-relative-time-0.2.0-publication-result1.md)
records the package's read-only validation boundary.

The existing `ValidationService` forwards published Validator diagnostics to
the Dataset import/export boundary and existing generic import-information or
import-failure UI. No Relative Time-specific EN/JA notice or semantic UI was
added. The existing Dataset, Event, and export services keep the exact
Specification declaration and Relation payload opaque to NarrativeLine's
writer; Relative Time is not added to its writer-owned declaration map. No
History grounding, assertion truth evaluation, Derived output, Relation
authoring, Timeline ordering, or migration is introduced.

Focused fixture-backed tests exercise valid `0.2.0` import, unrelated Event
description edit, export, and re-import, retaining the exact declaration, all
Relative Time Relations, and unknown sibling data. They also cover the
existing `0.1.0` fixture, invalid `0.2.0` Feature/payload diagnostics,
unsupported exact-version warning and opaque preservation without fallback,
and refusal to invent an undeclared Relative Time declaration. A comparison
test confirms Timeline ordering is unchanged by the Relation data. Existing
UI integration tests cover the generic diagnostics presentation path; this
checkpoint did not perform a separate real-browser manual acceptance run.

Verification: focused tests **5/5 PASS**; full `npm test` **264/264 PASS**,
`npm run lint` **PASS**, and `npm run build` **PASS** after the package update.
The npm install reported two high-severity audit findings; dependency
remediation is outside this bounded checkpoint. Application version remains
`0.1.0`; no tag, push, release, deploy, or publication was performed.
