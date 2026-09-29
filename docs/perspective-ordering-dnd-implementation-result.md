# Perspective Ordering Drag and Drop — Implementation and Human Acceptance

Date: 2026-09-29

Status: **HUMAN ACCEPTED / CLOSED — SUPPLEMENTARY PERSPECTIVE ORDERING INPUT**

The Human accepted card-wide Drag & Drop as an additional input to the existing
Perspective display-order operation. Ordinary Timeline remains read-oriented:
drag cannot change its Dataset. The Human explicitly enters the session-only
**Edit display order** mode through More or a mismatch review action before
cards become draggable. There is no separate drag handle. The native ↑/↓
buttons remain a complete keyboard-only ordering path.

The entire destination card is the drop hit area. Its surface changes color as
the primary target cue; a subdued line at its top or bottom indicates insertion
before or after that card. There is no third "center" position. Editing-mode
card drag suppresses unintended native text selection; ordinary read/select
and text interaction remain available. Card buttons and disclosure summaries
retain their own actions. Pointer drag, touch hold-drag, viewport-edge scroll,
Escape/pointer cancellation, and post-drop selection/focus use the existing
interaction implementation. Reduced-motion settings suppress movement effects
without blocking the ordering operation.

The drop applies the existing adjacent Perspective move rule to an in-memory
Dataset and commits only the final result. No-op drops leave the Dataset
unchanged. Existing authoring refusal, placed/unplaced composition, dangling
reference preservation, mismatch diagnostics, and export behavior remain the
operation's responsibility. DnD adds no portable state and does not reorder
Core Events or change History, Relative Time, dates, or temporal fields.

## Human Browser Acceptance boundary

The Human reported PASS for card-wide drag; the destination card surface as
the primary drop cue with before/after lines as acceptable secondary feedback;
resolved unintended text selection; no ordinary-mode reorder; practical
long-Timeline drag and edge scroll; retained selection/focus after drop; and
normal operation of card controls including Edit and Review display order.
The Human also confirmed that drag/drop and ↑/↓ work with reduced motion and
that their results remain understandable. A physical-touch DnD operation had
been confirmed earlier. No additional final physical-touch retest is claimed.

## Implementation and verification

The implementation checkpoints are `16ed9a2` (initial DnD), `e917af8`
(text-selection and card-wide hit area), `8c2aa0f` (card highlight), and
`dc274fa` (card-surface-first visual hierarchy). Automated coverage includes
ordinary-mode drag refusal, editing-mode drop and focus, button exclusion,
touch scroll versus hold, edge scrolling, distant moves, before/after target
selection, text-selection boundaries, unsupported authoring refusal, dangling
ID preservation, and import/export round-trip safety. Final closure verification:
`npm.cmd test` **325/325 PASS**, `npm.cmd run lint` PASS, `npm.cmd run build`
PASS, and `git diff --check` PASS.

This application acceptance does not reopen [Perspective 0.1.0 Timeline
Ordering](perspective-0.1.0-timeline-ordering-implementation-result.md),
[ordering progressive disclosure](progressive-disclosure-human-acceptance-result.md),
or Relative Time progressive disclosure. The separate [E2R-SPEC acceptance
record](../../e2r-spec/docs/narrativeline/narrativeline-perspective-ordering-dnd-human-acceptance.md)
provides the current cross-repository status pointer.
