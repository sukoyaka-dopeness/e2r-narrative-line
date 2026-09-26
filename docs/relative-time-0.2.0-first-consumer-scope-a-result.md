# Relative Time 0.2.0 First-Consumer Scope A Result

Date: 2026-09-26
Status: **IMPLEMENTATION VERIFIED / MANUAL ACCEPTANCE PASS / BOUNDED READ-ONLY SUPPORT; NO APPLICATION RELEASE**

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
UI integration tests cover the generic diagnostics presentation path. The
separate Real Browser Manual Acceptance was completed later and is recorded
below.

## Earlier real-browser attempt (2026-09-26; superseded by the closure below)

Status at that attempt: **PARTIAL EVIDENCE; MANUAL ACCEPTANCE NOT CLOSED**.
In local Edge against the Vite development server, the canonical `0.2.0`
all-families Dataset opened through the real file picker. Its 13 undated
Events remained visible without a Relative Time-specific UI or apparent
Relative Time-driven Timeline ordering. An unrelated Event description edit
saved in the browser. The existing `0.1.0` all-families Dataset also opened
(11 Events).

Separate browser imports showed generic diagnostics for an invalid `0.2.0`
Feature declaration (`relative_time_feature_declaration_mismatch`), invalid
Relation payload (`relative_time_relation_invalid`), and an unsupported
`0.3.0` exact version (`specification_version_unsupported`). The unsupported
Dataset remained viewable with the warning; this observation does not assert
semantic support or fallback. The generic import-failure path was visible in
both Japanese and English. No dedicated Relative Time guidance was added.

The first browser attempt did not produce a completed downloadable Dataset.
On a second attempt, the ordinary `More → Export E2R JSON` action also
produced no browser download event within 20 seconds. No page-level warning or
error was present in the captured console logs. At that point, browser export,
re-import, and structural preservation had not been verified; the evidence
did not determine whether the observation came from the browser/download
environment or the application export path.

## Final real-browser manual acceptance (Human-confirmed 2026-09-26)

Status: **PASS / ACCEPTED / CLOSED for first-consumer scope A**. The Human
confirmed that a normal browser Export created an actual Dataset file, even
though Codex did not capture a download-completion event. The Human obtained
that artifact and confirmed it retained the exact Relative Time `0.2.0`
Specification declaration, Relative Time Relation payloads, intentional
unknown sibling data, and the unrelated Event description saved during the
browser session. The artifact was re-imported through Edge's ordinary Import;
13 Events returned, and Event Detail showed the saved description
`Browser acceptance: unrelated description`.

This Human-confirmed artifact inspection and re-import completes the
round-trip evidence that was missing in the earlier attempt. It is distinct
from the fixture-backed automated round-trip tests described above. Together
with the earlier browser observations in this record, the manual acceptance
covers valid `0.2.0` and existing `0.1.0` imports, generic diagnostics for
invalid `0.2.0` Feature/payload data in EN/JA, an unsupported `0.3.0` warning
without observed semantic fallback, unrelated Event editing, preservation
through export/re-import, and the absence of Relative Time-specific UI or
Relative Time-driven Timeline ordering.

Closure remains limited to exact-version read-only recognition, existing
generic diagnostics, and round-trip preservation. Relative Time `0.2.0`
remains a Candidate, not Stable. This acceptance does not add semantic
presentation, authoring, Derived reasoning, solver behavior, conflict
resolution, migration, or application release readiness.

Verification: focused tests **5/5 PASS**; full `npm test` **264/264 PASS**,
`npm run lint` **PASS**, and `npm run build` **PASS** after the package update.
The npm install reported two high-severity audit findings; dependency
remediation is outside this bounded checkpoint. Application version remains
`0.1.0`; no tag, push, release, deploy, or publication was performed.
