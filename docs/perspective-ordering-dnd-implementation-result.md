# Perspective Ordering Drag and Drop — Implementation Result

Date: 2026-09-29

Status: **IMPLEMENTED / AUTOMATED VERIFICATION PASS / HUMAN BROWSER ACCEPTANCE PENDING**

The Human selected card-wide drag only while session-only display-order
editing is enabled. The ordinary Timeline keeps its read/select behavior.
There is no separate drag handle, and native ↑/↓ buttons remain the complete
keyboard ordering path.

Pointer movement begins a drag after a small movement threshold. Touch keeps
native vertical scrolling if the finger moves before a short hold; a held card
starts drag. Card buttons and disclosure summaries retain their own actions.
The source card, before/after destination, and a localized status indicate the
drag in progress. Escape or pointer cancellation aborts without changing the
Dataset. Near a viewport edge, the page scrolls while dragging. A successful
drop selects and focuses the moved Event.

The drop operation applies the existing adjacent Perspective move rule to an
in-memory Dataset and commits only its final result. No-op drops leave the
Dataset unchanged. Existing authoring refusal, placed/unplaced composition,
dangling reference preservation, mismatch diagnostics, and export behavior
remain the operation's responsibility. DnD adds no portable state and does
not reorder Core Events or change History, Relative Time, or temporal fields.

Automated coverage includes ordinary-mode drag refusal, editing-mode drop and
focus, nested button exclusion, touch scroll versus hold, edge scrolling, a
distant move, unsupported authoring refusal, dangling ID preservation, and
round-trip safety. The full NarrativeLine test, lint, and build gates passed
at the implementation checkpoint.

Human Browser Acceptance remains to check desktop cursor/target feedback,
click and text interaction, touch scroll and hold on a physical touch device,
long Timeline edge scrolling and drop, focus after drop, and reduced-motion
presentation. No browser acceptance is claimed by this result.
