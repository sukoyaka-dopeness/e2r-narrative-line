# Cross-App More Trigger Neutral Presentation

Date: 2026-10-09

## Finding

The More trigger's base rule uses the neutral app background and text tokens.
No `aria-expanded` presentation rule changes its appearance when the menu is
open. The purple appearance came from the global `button:hover:not(:disabled)`
rule, which applies the accent border and lavender hover background. Keyboard
focus uses the global purple `:focus-visible` outline.

## Change

The More trigger now keeps the neutral border, text, and background while
hovered. Its focus-visible ring remains a clearly visible 3px accent outline
with a 3px offset. The base and expanded states use the existing neutral
appearance; menu state, items, layout, localized labels, open/close handlers,
Escape/outside dismissal, roving menu navigation, and trigger focus behavior
are unchanged. ParameterPlotter and LiaisonScape remain read-only in this
checkpoint.

## Verification and acceptance

The focused presentation test checks neutral rest and hover styles plus the
retained focus ring. Existing WorkspaceMoreMenu integration tests cover
keyboard opening, item navigation, Escape, outside dismissal, focus return,
and action activation. Automated tests and build/lint results are recorded in
the implementation checkpoint. Browser visual comparison and Human Browser
Acceptance remain pending. The prior Computer Use attempt failed during
Windows sandbox setup; a fresh `cua.getState()` retry also terminated the
trusted Node process and reset the kernel. No visual PASS is inferred from
source or tests.
