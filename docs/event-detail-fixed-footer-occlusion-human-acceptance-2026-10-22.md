# Event Detail fixed-footer occlusion — bounded Human acceptance (2026-10-22)

Status: **NL-EVENT-DETAIL-RESPONSIVE-ACTION-FIX2 HUMAN BROWSER RE-ACCEPTANCE PASS (LOCAL / BOUNDED)**. The FIX2 source and this record are local and uncommitted at this checkpoint. This is not a public deployment or production verification.

The E2R-SPEC Roadmap is the current planning authority. NarrativeLine `0.2.1` remains the published application version; its earlier public release closure is unchanged.

## Checkpoint sequence

1. **AUDIT1:** At intermediate widths, the fixed Event Detail action footer covered part of `Delete Event`. Keyboard focus could reach a button that was not fully visible, and a click in the overlap could hit Back/Discard.
2. **FIX1:** An Event-specific `scroll-margin-bottom: 200px` improved focus-driven scrolling. Human Browser review passed 900px EN/JA, 601px JA and clean EN, and 390px EN/JA, but **failed at 601px EN with unsaved changes**. The long `Discard Unsaved Changes and Return` label made the footer two rows high; ordinary scrolling still allowed partial occlusion. FIX1 did not receive Human acceptance.
3. **FIX2:** The Event Detail action footer's rendered height is measured and the Event Detail scroll region ends above it. The FIX1 scroll-margin rule was replaced. `src/screens/EventDetailScreen.tsx` and `src/index.css` are the only FIX2 implementation files. The fixed footer, Save / Save and Add Related Entity / Back or Discard / Delete meanings, DOM action order, and deletion-confirmation behavior remain unchanged.

## Verification evidence, kept separate

- **Source / automated:** The FIX2 worktree passed 375/375 tests, lint, build, and `git diff --check` in the Codex implementation run. These checks included the separate, uncommitted History 2.0 ordering correction and its regression test; they are not an isolated FIX2-only test result.
- **Codex Browser:** In a disposable local Edge tab, 601px EN with unsaved changes showed a 97px two-row footer. Ordinary scrolling exposed the whole Delete button above the footer; button hit tests resolved to Delete, Tab and Shift+Tab retained visible focus, and Cancel/Escape returned focus to Delete. A 601×700px EN check also kept the button above the footer. Other sampled layouts included 900px JA, 601px JA, and 390px EN. This is agent-operated evidence, not Human Browser acceptance.
- **Human Browser:** Human used Microsoft Edge InPrivate on local NarrativeLine and reported PASS for 601px EN dirty, 601×700px EN dirty, 390px JA with a vertically arranged footer, and 616px EN dirty. Human checked ordinary scrolling, Tab/Shift+Tab, Delete visibility and operability, absence of footer overlap or misdirected clicks, safe dismissal of the deletion confirmation, focus restoration, and return to Timeline with ordinary scrolling. No Event was actually deleted or saved. This report is the basis of the bounded local acceptance above.

At 616px EN, part of Delete was outside the scroll region while scrolling. At the bottom of the region the complete button was visible above the footer. Human did not classify that transitional clipping as a remaining defect.

The Delete Event confirmation does not close on a backdrop click. The same non-dismissible backdrop contract applies to Delete Entity, so Human accepted the existing behavior without a dismissal change. Informational dialogs may use a different dismissal contract.

## Boundary and next gates

This acceptance covers the tested local Event Detail footer clearance and related keyboard/confirmation interactions. It does not cover an actual deletion or save, every viewport/content combination, other application screens, a Git commit, a push, public deployment, production verification, or NarrativeLine-wide release closure. No new Human Browser PASS is inferred from Codex Browser or automated results.

The separate History 2.0 same-day ordering fix is implemented and automatically verified but still needs its own Human Browser acceptance. The adopted four-app Ko-fi Home direction is not implemented here. `docs/ui-spec.md` describes Back on the left of the action bar while current Runtime places it on the right; that documentation discrepancy remains independent and has not been reinterpreted as a prior Human layout decision.

Before publication, separate Human decisions are needed for an exact commit range, any other release changes, push and deployment, and later production verification. The local worktree HEAD alone is not a FIX2 release or acceptance-source SHA while these implementation changes remain uncommitted.
