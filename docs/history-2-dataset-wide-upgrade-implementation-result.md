# History 2 Dataset-wide H1 to H2 Upgrade Implementation Result

Date: 2026-09-19

Status: **IMPLEMENTED / AUTOMATED GREEN / BOUNDED REAL-BROWSER AND HUMAN ACCEPTANCE COMPLETE**

Scope: NarrativeLine implementation and automated migration gate for the
approved Dataset-wide History `1.0.0` to `2.0.0` Candidate upgrade.

Authority: The approved scope is defined by the E2R-SPEC
[scope-closure result](https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/history-2-dataset-wide-h1-to-h2-upgrade-scope-closure-result.md).
Current application source and tests are the implementation authority.

This result records acceptance for the bounded H2-POSITION-CIRCA capability;
it does not promote History 2.0.0 Candidate to Stable.

## Implemented boundary

NarrativeLine now performs an explicit Dataset-wide upgrade when the first
H2-only capability, `approximation: "circa"`, is confirmed from Event Detail.
The converter preflights all History payloads on all Core Objects:

```text
Entity + Event + Relation
```

Entity and Relation History is converted for Dataset consistency; no Entity or
Relation History authoring UI was added.

The Dataset container itself cannot carry the H2 History payload. A Dataset-
level History occurrence is refused.

## Conversion and atomicity

For every eligible H1 payload, `history.time` is converted to one H2
`position` assertion. Civil Time fields, `timeZone`, `offset`, granularity, and
`temporalOrder` are preserved; `temporalOrder` moves to assertion level. The
requested Event receives only `position.approximation: "circa"`. Other converted
objects receive exact H2 positions.

Assertion IDs are generated once as stable application-local
`history-position-<Core Object ID>` values. They are local assertion IDs, not
Core Object IDs, are not index-derived, and are preserved by later H2 edits.

The operation builds a new Dataset off-state, synchronizes the exact H2
declaration and Dataset-wide Features, validates the completed result through
the current Validator, and commits the result once. No partial H1/H2 state is
published. Cancel, preflight refusal, conversion failure, or final validation
failure leaves the original Dataset unchanged.

The Event Detail draft is cleared only after the update succeeds. Canceling the
upgrade dialog keeps the current unsaved Event fields and leaves the Dataset in
H1.

## Refusal and compatibility boundary

The implementation refuses the complete upgrade for malformed or unknown
History, a missing/invalid H1 `year`, temporalOrder-only History, unknown
History or Time members, legacy `order`, invalid Civil Time, malformed or
unsupported History declarations/Features, mixed H1/H2 state, undeclared H2
candidate payloads, Dataset-level History, and unsafe declaration completeness.
Unknown data is not discarded or guessed.

Known-shape undeclared legacy H1 payloads are accepted only when every History
occurrence is eligible and a complete exact Specification declaration can be
created safely. The input is not retroactively labeled as previously declared
H1.

Opening, viewing, ordinary exact editing, saving, exporting, and reloading do
not migrate H1. H1 export without H2-only use remains H1. A successful upgrade
exports H2 assertions and the exact H2 declaration. Turning circa off removes
only the approximation; it does not downgrade the Dataset to H1. Removing one
H2 History payload retains the declaration while other History remains, and
removing the final payload performs the existing safe declaration cleanup.

The approved Option A Timeline projection is unchanged. It uses recorded Civil
Time for presentation and does not create ranges, midpoints, confidence,
semantic ordering, or Derived Relations.

## Responsibility changes

Retained responsibilities include supported single-position H2 editing,
circa ON/OFF, Option A presentation, read-only/refusal behavior for unsupported
states, immutable Dataset updates, existing H2 assertion-ID preservation, and
EN/JA approximation presentation.

The former Event-local H1-to-H2 conversion and Event-only declaration/Feature
aggregation were generalized to Dataset-level services covering Entity, Event,
and Relation. Draft cleanup now follows successful Dataset mutation rather than
preceding it.

No schema, Candidate specification, Validator semantic rule, sample Dataset,
Relative Time behavior, bounded-point, temporal-extent, multiple-assertion
authoring, H2-to-H1 downgrade, CSS, or Entity/Relation authoring behavior was
added.

## Automated evidence

The counts in this historical implementation section are the interim baseline
for this checkpoint. The final closure gate is recorded in the bounded closure
records as 24 focused tests and 251 full-suite tests passing.

Focused migration coverage: **15/15 PASS**.

The focused and application-path tests cover:

- ordinary H1 exact edit and H1 export boundary;
- conversion across Entity, Event, and Relation History;
- Civil Time granularity, Time Zone, offset, and temporalOrder preservation;
- stable assertion IDs and Dataset-wide declaration/Feature synchronization;
- eligible undeclared legacy H1;
- mixed, unknown, temporalOrder-only, legacy-order, and Dataset-level refusal;
- immutable source preservation on refusal;
- H2 circa editing and circa OFF without downgrade;
- export/re-import round trip;
- Event Detail confirmation and Cancel draft preservation.

Full NarrativeLine suite: **246/246 PASS**, natural completion.

Additional gates:

- `npm run lint`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- final Dataset validation: PASS through `@sukoyaka-dopeness/e2r-validator`

The test suite continues to print the known non-failing Vite middleware
WebSocket warning that port `24678` is already in use. The suite exits
naturally with all assertions passing. This checkpoint does not diagnose that
condition.

## Confirmation dismissal consistency

The H1-to-H2 confirmation uses the shared `ModalDialog` behavior for its
safe cancellation paths: Cancel, Escape, and a click on the backdrop outside
the dialog all dismiss without committing the Dataset-wide upgrade. A click
inside the dialog does not dismiss it. The existing dialog focus restoration
returns focus to the control that opened the confirmation.

The H2-specific integration coverage verifies that backdrop dismissal keeps
the Dataset in H1, preserves the unsaved Event draft and approximation state,
leaves the persisted Dataset unchanged without a partial declaration or
approximation Feature, and restores opener focus. This is a bounded
interaction consistency fix; it does not establish a global policy that every
dialog must dismiss on backdrop click.

## Bounded acceptance closure

The implementation was subsequently verified through the original Real
Browser acceptance paths and is closed for the bounded H2-POSITION-CIRCA
scope. Evidence includes safe and unsafe Dataset-wide upgrade flows, draft and
Dataset atomicity, confirmation dismissal/focus behavior, Option A Timeline
presentation, circa removal, History removal, EN/JA and locale switching,
narrow layout, export/reload/re-import, the multi-H2 exact-edit declaration
regression, and the unknown/unsupported/mixed History boundary.

The canonical Relative Time fixture was also loaded through the real file
input. NarrativeLine kept its 11 Events undated in the Timeline, did not use
Relative Time Relations for History dates or ordering, left the Dataset clean,
and produced no console/runtime error. Relative Time payload preservation and
export validation remain covered by the exact automated JSON round-trip. A raw
browser download artifact was not directly captured in one live run because
the download observer timed out; that limitation is recorded as an evidence
boundary and is not treated as an application export failure.

The final bounded status is:

```text
H2-POSITION-CIRCA: ACCEPTED / CLOSED
History 2.0.0: Candidate / NON-STABLE
```

Bounded-point, temporal-extent, multiple-assertion, Relative Time authoring or
solving, H2 to H1 conversion, Entity/Relation History authoring, History 2
Stable promotion, and release/deployment remain outside this result.
