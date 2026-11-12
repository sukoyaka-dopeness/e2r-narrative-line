# Home-to-Hub navigation — local implementation

Date: 2026-11-04 JST

Status: PUBLIC E2E PASS (BOUNDED) / HUMAN PUBLICATION CLOSURE APPROVED (BOUNDED)

The Human-selected link appears only in `HomeScreen`, after the locale-matched
Guide and before the separate Sponsors/Ko-fi group. It uses the current
`useLanguage()` value in the public Hub's `#locale=` fragment. The exact JA/EN
labels, native new-tab attributes and localized accessible new-tab explanation
match the approved direction. Font size is the existing Home Guide's `.875rem`
with normal weight. AppFrame, Footer, Credits, Timeline/Detail/Picker/Create,
Import handling and Dataset state transitions are unchanged.

409 tests, lint and build passed. Added integration assertions cover locale,
link attributes, accessible wording and separation from support/Footer.
Isolated Edge checked both languages at 1280x900, 390x844 and 320x640, including
computed typography parity, new-tab opening, null opener and unchanged source
Home/serialized Dataset keys. Local Hub candidate reception and `#top` were
checked separately from public destination opening because reception is not yet
published. No Dataset operation was invoked.

The [workspace verification record](../../e2r-hub/docs/home-to-hub-navigation-2026-11-04.md)
contains shared evidence and limits. Existing Home and navigation acceptance
remain bounded; they do not accept this new link. Manual screen-reader and
active-edit browser review remain unperformed. No Commit, Push or Deployment.

## Final acceptance preparation — 2026-11-04

The current scoped source diff was rechecked; runtime and tests were not edited.
Fresh selected Home/support/link and Credits tests passed 4/4. The prior 409-test,
lint/build evidence is retained for the unchanged candidate, not rerun wholesale.
SHA-256 fingerprints bind current implementation/tests/manifests in the shared
diagnostic directory. Native Edge Tab/Shift+Tab order, visible focus, Enter new
tab, null opener, accessible link name/new-tab notice, and Credits Escape/focus
return passed in EN/JA at 1280x900 and 390x844. A clean, synthetic diagnostic
Dataset was imported through Home; Hub navigation preserved Home/storage and
Continue returned identical Workspace text. No user Dataset was used.

Assessment: ready for a bounded Human decision, with no material blocker found.
Actual screen-reader speech, pending edits/degraded-save browser cases and public
four-app end-to-end checks remain unverified. Human visual/keyboard review or
explicit acceptance of the bounded evidence is still required. The shared record
provides local URLs, exact candidate files, limits and deployment implications.
No formal acceptance, Commit, Push or Deployment occurred in this preparation.

## Bounded Human Acceptance and sequential publication authorization — 2026-11-04

The Human explicitly accepted this bounded Home-to-Hub candidate using the
recorded automated tests, lint/build and Codex-operated isolated Edge evidence.
This does not claim that the Human performed every browser operation, nor does
it expand acceptance or release decisions for other features. Earlier pending
acceptance statements above describe the preparation snapshot and are superseded
only within this bounded scope.

Accepted: normal-Home link placement after Guide and before support, secondary
link typography, EN/JA, safe new-tab navigation, locale-only transfer with no
Dataset transfer/change, and ParameterPlotter's non-owner boundary; Hub startup
locale reception, manual UI/URL synchronization, reload persistence, no history
growth, top navigation and startup-only Back/Forward behavior.

NOT VERIFIED at acceptance: actual screen-reader speech, all pending-edit and
save-failure states, exhaustive browser engines, and public four-app end-to-end.
These are accepted evidence limits, not PASS results. Public evidence must be
measured separately after deployment. Publication Closure remains a separate,
explicit Human decision even if technical public checks pass.

The Human authorized exactly 17 candidate paths: Hub 5 and each app 4, including
this existing record. Exclude Hub's separate Dataset Workflow publication
addendum, LiaisonScape's three pre-existing untracked diagnostic paths, and all
unrelated work. Each repository receives an independent commit and ordinary
main push using the existing Pages workflow. Order: Hub, NarrativeLine,
LiaisonScape, ParameterPlotter. Each preceding deployment and public check must
PASS before the next push. Stop for unexpected scope, history, gate, deployment
or public regression; no force push or history rewrite is authorized.

Publication has not yet been verified at this checkpoint. Later measured
publication results will be recorded locally without an automatic extra push.

### Fresh publication preflight

Current full repository checks passed on 2026-11-04: tests, available lint (or
ParameterPlotter syntax check), and build. The implementation/test/dependency
SHA-256 manifest matches the final candidate; no runtime change was introduced
during acceptance recording. See isolated publication diagnostic logs for output.

## Actual publication evidence — 2026-11-04 (local addendum)

Commit `e85c5d6802c862708e17918572413194f3af9a6f` contains exactly HomeScreen.tsx,
index.css, localePresentationCompletenessIntegration.test.js and this record.
Ordinary main push and [Pages run 41818751921](https://github.com/sukoyaka-dopeness/e2r-narrative-line/actions/runs/41818751921)
PASS, after Hub's public Phase A PASS. Public Home:
https://sukoyaka-dopeness.github.io/e2r-narrative-line/

Actual public Home to public Hub passed EN/JA at 1280 and 390px in disposable
isolated Edge: labels, order, typography parity, no overflow, new tab/null opener,
receiver locale, top/manual switching and unchanged source Home/Dataset storage.
Desktop JA and Narrow EN screenshots were inspected. Public entry asset
index-BnAi9UVJ.js matched the exact-SHA Pages build log. Public Hub reverse
launches to NarrativeLine also passed both languages. No material regression
was found in these performed checks; screen-reader speech and all edit/failure
states remain unverified.

Sequential publication later stopped on LiaisonScape's server-side push failure.
The shared Hub record contains exact details and preservation checks. Final
four-app public E2E and Human Publication Closure remain pending. This result
addendum is local only; no second documentation commit or push was made.

## Bounded Publication Closure — 2026-11-12 JST

The subsequently completed four-repository publication and Codex-operated public
E2E checks are recorded in the Hub and LiaisonScape Home-to-Hub records. The
earlier sequential stop above remains a historical snapshot. Human confirmed
the new-tab route to Hub and approved bounded Home-to-Hub Publication Closure.
This is separate from earlier candidate Acceptance and Codex public checks;
Human did not claim to perform their full browser matrix.

**CLOSED (BOUNDED).** Public checks covered EN/JA at effective 1280/390px,
locale reception and clean synthetic Dataset round trips. Screen-reader speech,
pending-edit/save-failure states, exhaustive engines and full Dataset byte
identity remain unverified. The separate dirty Locale record is outside this
Closure and remains untouched.
