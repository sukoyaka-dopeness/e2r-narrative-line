# Legacy Dataset Compatibility

NarrativeLine preserves compatibility through explicit, fixture-backed import
profiles. Compatibility is an application import concern; legacy fields are not
added to the E2R Core or current application model.

## Import pipeline

Dataset import proceeds in this order:

1. Parse the source JSON without modifying it.
2. Match an exact, documented NarrativeLine legacy profile.
3. Apply that profile's pure in-memory migration.
4. Validate the complete migrated value with the current E2R Validator.
5. Open the migrated Dataset only when validation succeeds.

Opening a file never overwrites the selected file. The import result retains
the original source string when a migration occurs. Export always emits dates
in the current History representation, whether or not the user edited the
migrated Dataset. The import notice states both outcomes so that preserving the
source and upgrading dates in a newly exported file cannot be confused.

For newly exported output, NarrativeLine also adds a Specification Extension
declaration when it can identify every used Extension version exactly. The
legacy profile fixture therefore exports with Metadata and History version
`1.0.0` declarations and reimports without version-unspecified diagnostics.
An unknown Extension prevents automatic declaration; NarrativeLine never emits
an incomplete `uses` list or guesses a version. A declaration already present
in the imported Dataset is preserved rather than replaced.

The Core `version` is not used as a NarrativeLine format-version marker. A
legacy profile must be identified by its own documented structural evidence.
Unknown or partially matching shapes are not guessed.

Import also does not retroactively assert an exact Extension specification
version that the source did not declare. Conformance to a currently supported
shape is not evidence of which exact specification version the original
producer used. The Validator therefore reports such Extensions as version
unspecified. NarrativeLine groups those non-blocking diagnostics into a plain
language import notice and retains their exact codes and JSON Pointer paths in
the expandable diagnostic details.

## Supported profile: `narrativeline.event-date-string.v1`

This profile records every Event's date in a top-level `date` string. It is the
temporary representation used by NarrativeLine before History Extension
integration.

Recognition requires:

- a non-empty Event collection;
- every Event to own a top-level `date` field;
- every `date` to be an empty string or a valid `YYYY-MM-DD` Gregorian date;
- no Event to contain an `extensions.history` member.

Migration performs only these changes:

- a non-empty `date` becomes `extensions.history.time.year`, `month`, and `day`;
- an empty `date` becomes no History value;
- the migrated top-level `date` member is removed.

All other Dataset, Core Object, Relation, Extension, and unknown fields are
preserved. A conflicting History value or invalid legacy date fails import
with a stable diagnostic instead of selecting or repairing a value.

The authoritative regression fixture is
`tests/fixtures/legacy/narrativeline-event-date-string-v1.e2r.json`.

## Adding another profile

A new legacy profile must be append-only and include:

- evidence that NarrativeLine actually produced or officially accepted the
  representation;
- an immutable representative fixture;
- a unique internal profile identifier;
- exact recognition criteria that do not claim unrelated valid E2R data;
- a pure migration that preserves unknown data;
- tests for success, ambiguity or conflict, source preservation, and current
  Validator acceptance;
- a documented migration target and any information loss.

Existing profile semantics and fixtures must not be silently rewritten. If a
second migration step is needed, introduce another explicit profile or target
step and retain the old fixture as a regression test.
