# Ko-fi Home link — bounded local Human acceptance (2026-10-22)

Status: **NL-KOFI-HOME1 HUMAN BROWSER ACCEPTANCE PASS — LOCAL / BOUNDED**. The NarrativeLine Home implementation and this record are local and uncommitted at this checkpoint. This is not a push, public deployment, production verification, or NarrativeLine-wide release closure. The E2R-SPEC Roadmap remains the current planning authority for the four-app direction.

## Implementation and scope

NarrativeLine Home places `https://ko-fi.com/sukoyaka_dopeness` in the lower support-link group next to the existing GitHub Sponsors link, below the primary Dataset actions and User Guide. The visible labels are **Support E2R on Ko-fi** (EN) and **Ko-fiでE2Rを支援する** (JA). The link opens a new tab with `rel="noopener noreferrer"`. The existing Sponsors link, Home actions, Locale control, Credits, navigation, Dataset replacement, and Handoff contracts were not changed for this work. The implementation is in `src/screens/HomeScreen.tsx`, `src/i18n/messages.ts`, and the Home-specific rule in `src/index.css`; `tests/localePresentationCompletenessIntegration.test.js` checks the locale text, target URL, link attributes, and grouping.

This is NarrativeLine's application-local implementation of the Human-adopted four-app Ko-fi direction. It does not implement or accept Ko-fi in Hub, LiaisonScape, or ParameterPlotter, and it does not establish a pixel-identical cross-app layout.

## Evidence, kept separate

- **Source / automated:** The preceding Codex implementation run reported 375/375 tests, lint, build, and `git diff --check` PASS for the then-current worktree. That worktree also contained the separate uncommitted History 2.0 and Event Detail FIX2 corrections, so the full-suite result is not a Ko-fi-only run. The Home locale integration test checks both support links in EN/JA.
- **Codex Browser:** In a new local Microsoft Edge tab, Codex observed the EN/JA Home at normal width and 390px. Both support links appeared below the Dataset actions, Ko-fi followed Sponsors in Tab order, its focus outline was visible, and Enter opened `https://ko-fi.com/sukoyaka_dopeness` in a new tab. This was agent-operated verification, not Human Browser acceptance. No Dataset or saved Workspace was edited during that check.
- **Human Browser:** Human reviewed the local Home in Microsoft Edge and reported PASS for EN/JA at normal width and 390px, the Sponsors/Ko-fi placement, lower visual priority than the main Dataset actions, and both localized labels. Human supplied four screenshots and judged the Ko-fi implementation PASS. These are Human observations and the basis for this bounded acceptance; this record does not claim fresh independent inspection of the screenshots. The keyboard activation and destination checks above are Codex Browser evidence, not additional Human Browser observations. Human did not perform a donation or payment.

## Acceptance boundary and remaining gates

Human accepted the local NarrativeLine Home presentation within the four reviewed locale/width combinations. This does not accept every viewport or browser, third-party Ko-fi availability over time, a public NarrativeLine deployment, or production behavior. Commit scope, push, deployment, public verification, and release closure require separate decisions. The independent History 2.0 same-day Timeline correction and Event Detail FIX2 retain their own local bounded Human acceptance records and remain uncommitted and unpublished at this checkpoint.
