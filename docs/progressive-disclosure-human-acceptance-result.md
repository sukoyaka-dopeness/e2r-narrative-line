# NarrativeLine Progressive Disclosure — Human Acceptance Result

Date: 2026-09-28

Status: **RELATIVE TIME AND PERSPECTIVE ORDERING PROGRESSIVE DISCLOSURE — HUMAN ACCEPTED / CLOSED**

Detailed Human acceptance and current planning pointers are recorded in the
[E2R-SPEC acceptance record](../../e2r-spec/docs/narrativeline/narrativeline-progressive-disclosure-human-acceptance.md).

## Implementation closure

Relative Time presentation derives from active Dataset evidence as OFF, ON, or
DIAGNOSTIC. OFF starts with the advanced UI hidden; explicit More-menu
activation is session-only and shared between Timeline and Event Detail.
Supported records derive ON. Unrecognized or unsafe-to-classify Relative Time
evidence remains discoverable as DIAGNOSTIC and does not by itself grant
authoring capability. Dataset replacement resets the manual choice and derives
presentation from the replacement Dataset. No UI preference is written to the
Dataset.

Perspective display-order editing starts OFF, is explicitly entered through
More or the local mismatch review action, and remains session-only. Reviewing a
mismatch does not itself enable editing. Existing ordering behavior and
portable Perspective sequence remain unchanged.

The Japanese More action now reads `相対時間の機能を表示`, matching the
Human-selected wording. Automated regression coverage checks the localized
entry. Human Browser Acceptance evidence, including the unsupported Relative
Time `0.3.0` fixture and export preservation, is recorded in the linked
acceptance record.

The Validator 0.7.0 Perspective `unknown_extension` and
`specification_unavailable` warnings remain visible as expected Validator
capability diagnostics. They are not filtered and are not failures of these
application presentation workstreams. Validator support remains separate.

No Core, History, Relative Time, or Perspective semantics, schemas, Candidate
contracts, Validator contracts, or portable UI preferences were changed. No
public sample, deployment, or release was created.
