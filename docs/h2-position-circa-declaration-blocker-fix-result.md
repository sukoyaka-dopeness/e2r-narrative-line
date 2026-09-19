# H2-POSITION-CIRCA - Declaration Blocker Fix and Acceptance Resume

Date: 2026-09-19
Status: **BLOCKER FIX VERIFIED / AUTOMATED GREEN / REAL-BROWSER PASS**

## Confirmed blocker and root cause

The previous Edge acceptance reproduced a failure after confirming the H1 to
H2 circa upgrade:

```text
Error: History 2 declaration could not be created safely
```

The failure occurred when a Dataset already contained another Stable History
1 Event. The declaration derivation refused that sibling while constructing the
Dataset-level History 2 declaration. A read-only Validator/export check
confirmed that simply allowing the sibling H1 payload under the H2 declaration
would produce an invalid Dataset (`history_2_time_and_assertions_conflict`).
The original browser setup therefore exercised an unsupported mixed-version
Dataset state, not a safe migration boundary.

## Minimal repair

> Historical interim repair boundary: the single-representation and sibling-H1
> statements below describe the first blocker-isolation repair. They were later
> superseded by the accepted Dataset-wide conversion contract recorded in the
> [Dataset-wide implementation result](history-2-dataset-wide-upgrade-implementation-result.md)
> and the final bounded closure records.

The source-first repair keeps the approved contract bounded:

- a valid single-representation Dataset can convert the explicitly selected
  Event to one History 2 `position` assertion;
- the Dataset declaration records History `2.0.0` and the actual H2 Features;
- unknown, unsupported, mixed `time` plus `assertions`, and malformed payloads
  remain refused or read-only;
- sibling H1 payloads are not silently migrated or placed under an H2
  declaration;
- no schema, Validator, sample, or Relative Time semantics are changed.

The implementation also moves the approximation control below the optional
time disclosure. EN/JA copy now describes the whole entered date and time,
and the explanation explicitly states that Timeline presentation uses the
entered value without creating a range or midpoint.

## Automated evidence

The counts in this interim repair section are historical checkpoint evidence;
the final closure gate is recorded as 24 focused tests and 251 full-suite tests
passing.

- H1 exact save remains H1: PASS;
- H1 to H2 circa confirmation and save through the Event Detail orchestration:
  PASS;
- H2 declaration synchronization for the approved single-representation path:
  PASS;
- approximation control order and EN/JA semantic wording: PASS;
- focused History 2 tests: **16 pass, 0 fail**;
- full NarrativeLine suite: **238 pass, 0 fail**, natural completion;
- `npm run lint`: PASS;
- `npm run build`: PASS;
- `git diff --check`: pending final commit verification.

The full suite continues to emit the known non-failing Vite middleware warning
for port `24678`; it terminates normally with zero failures.

## Real-browser status

The approved single-representation application path was subsequently verified
through the original Real Browser regression path. A valid H2 Dataset with one
circa Event and another exact Event retained the circa payload and the
Dataset-wide `approximation` Feature after the exact Event was edited. Timeline
dates remained valid, export validation succeeded, and the prior
`history_2_feature_declaration_mismatch` failure did not recur.

The broader bounded acceptance matrix then passed, including unsafe refusal,
History removal, EN/JA, keyboard/focus, narrow layout, and the Relative Time
preservation boundary. This repair record is now historical evidence for the
final bounded closure; the exact/circa/exact review used a valid H2 Dataset and
did not rely on an invalid mixed declaration.

The final capability status is recorded by the bounded implementation and
scope-closure records as `H2-POSITION-CIRCA: ACCEPTED / CLOSED`. History 2.0.0
remains a non-Stable Candidate.

## Scope and release boundary

The supported surface remains one exact History 2 position assertion with
optional position-level `approximation: "circa"`. Bounded-point,
temporal-extent, multiple assertions, Relative Time, schema promotion,
Validator release, sample changes, and public release work remain outside this
checkpoint.
