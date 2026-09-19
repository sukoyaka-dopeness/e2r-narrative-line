# H2-POSITION-CIRCA - Declaration Blocker Fix and Acceptance Resume

Date: 2026-09-19
Status: **BLOCKER FIXED / AUTOMATED GREEN / REAL-BROWSER ACCEPTANCE PENDING**

## Confirmed blocker and root cause

The previous Edge acceptance reproduced a failure after confirming the H1 to
H2 circa upgrade:

```text
Error: History 2 declaration could not be created safely
```

The failure occurred when a Dataset already contained another Stable History
1 Event. The declaration derivation treated that sibling H1 payload as
unsupported while constructing the Dataset-level History 2 declaration. The
resulting complete-use calculation returned no safe declaration and the save
path threw before navigation or persistence.

## Minimal repair

The repair keeps the approved contract bounded:

- sibling Stable History `time` payloads remain unchanged and editable;
- the explicitly selected Event is converted to one History 2 `position`
  assertion;
- the Dataset declaration records History `2.0.0` and the actual H2 Features;
- unknown, unsupported, mixed `time` plus `assertions`, and malformed payloads
  remain refused or read-only;
- no sibling data, unknown fields, schema, Validator, sample, or Relative Time
  semantics are migrated or rewritten.

The implementation also moves the approximation control below the optional
time disclosure. EN/JA copy now describes the whole entered date and time,
and the explanation explicitly states that Timeline presentation uses the
entered value without creating a range or midpoint.

## Automated evidence

- H1 exact save remains H1: PASS;
- H1 to H2 circa confirmation and save through the Event Detail orchestration:
  PASS;
- sibling Stable History preservation and H2 declaration synchronization:
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

The prior browser blocker is fixed by source and application-path regression
coverage. A fresh real-browser rerun was attempted after the repair, but the
browser connector failed to initialize and timed out. Therefore the following
remain pending and are not claimed as accepted:

- successful H1 to H2 upgrade in a fresh real browser;
- Timeline exact / circa / exact presentation;
- circa OFF, export/reload/re-import, and History removal;
- complete EN/JA, keyboard/focus, and narrow-layout review;
- human semantic judgment for the Option A presentation and upgrade UX.

This document does not mark H2-POSITION-CIRCA `ACCEPTED / CLOSED`.

## Scope and release boundary

The supported surface remains one exact History 2 position assertion with
optional position-level `approximation: "circa"`. Bounded-point,
temporal-extent, multiple assertions, Relative Time, schema promotion,
Validator release, sample changes, and public release work remain outside this
checkpoint.
