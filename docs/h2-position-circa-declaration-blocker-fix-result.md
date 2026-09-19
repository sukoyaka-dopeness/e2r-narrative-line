# H2-POSITION-CIRCA - Declaration Blocker Fix and Acceptance Resume

Date: 2026-09-19
Status: **BLOCKER BOUNDARY CLARIFIED / AUTOMATED GREEN / REAL-BROWSER ACCEPTANCE PENDING**

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

The approved single-representation application path is covered by source and
application-path regression tests. A fresh real-browser rerun was attempted
after the repair, but the browser connector failed to initialize and timed
out. Therefore the following remain pending and are not claimed as accepted:

- successful H1 to H2 upgrade in a fresh real browser;
- Timeline exact / circa / exact presentation;
- circa OFF, export/reload/re-import, and History removal;
- complete EN/JA, keyboard/focus, and narrow-layout review;
- human semantic judgment for the Option A presentation and upgrade UX.

This document does not mark H2-POSITION-CIRCA `ACCEPTED / CLOSED`. The
exact/circa/exact Timeline review must use a valid H2 Dataset fixture for all
H2 Events; it must not rely on an invalid H1/H2 mixed declaration.

## Scope and release boundary

The supported surface remains one exact History 2 position assertion with
optional position-level `approximation: "circa"`. Bounded-point,
temporal-extent, multiple assertions, Relative Time, schema promotion,
Validator release, sample changes, and public release work remain outside this
checkpoint.
