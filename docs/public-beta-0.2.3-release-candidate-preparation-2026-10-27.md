# NarrativeLine 0.2.3 Public Beta local release preparation — 2026-10-27

Status (current, 2026-10-27): **CONDITIONAL GO (BOUNDED) HUMAN-ADOPTED / 0.2.3 FINAL LOCAL CANDIDATE / RELEASE DATE 2026-10-27 JST HUMAN-SELECTED / PRE-COMMIT HUMAN REVIEW PENDING / NO COMMIT OR PUBLICATION**. The pending-date preparation checkpoint below is historical; the later date decision and final verification appear at the end.

## Authority and source identity

Human selected **CONDITIONAL GO (BOUNDED)**, version **0.2.3**, and the [bounded RC](public-beta-rc-integrated-audit-2026-10-27.md#formal-human-rc-acceptance--2026-10-27) scope: N4, F2, Diagnostics Presentation, F1, related limited corrections, regression tests and necessary documentation. The integrated Human Browser smoke is optional. The [decision record](public-beta-go-no-go-decision-preparation-2026-10-27.md#subsequent-human-decision--2026-10-27) does not approve a commit, push or deployment.

The accepted RC is committed HEAD `bb38fa904a38404845ec7afe097bf0dd2072e487` **plus** the audit-time dirty worktree, not HEAD alone. At this preparation's initial inventory, the same 14 tracked Runtime/test paths and the same nine originally untracked Runtime/test/evidence paths remained; the RC audit and GO/NO-GO preparation documents were later untracked additions. The audit has no byte-level manifest, so inventory continuity is not byte identity proof. This preparation changes only release metadata, EN/JA Guides, README and decision documents, plus the Credits expectation test; it does not change the accepted functional logic. The release metadata edits are a separate final candidate delta needing automated verification and Human diff review.

## Local 0.2.3 release delta

- `package.json` and root package metadata in `package-lock.json`: `0.2.3`; dependencies and lockfile resolution remain unchanged.
- At the initial preparation checkpoint, EN/JA Credits Application was set to `NarrativeLine 0.2.3`, First release remained `2026-08-06`, and Credits Updated showed **Release date pending / 公開日未確定**. Human later selected 2026-10-27 JST; the current local Credits and expectations now show `Updated / 更新日: 2026-10-27`. The prior placeholder is historical, not a current publication stop condition. A date choice is not publication evidence; if actual publication occurs on a different JST day, stop for Human date review and reverify the source before any Push.
- EN/JA User Guides now explain saved-Dataset Handoff protection, conditional same-link reload recognition, Current/Candidate warning ownership, expandable exact Diagnostics, invalid JSON failure separation, and generated Metadata declaration scope. They do not promise unknown Extension preservation or automatic migration.
- README continues to identify `0.2.2` as the last documented published version and separately points to this unpublished `0.2.3` candidate. Historical `0.2.2` publication records remain unchanged.

The proposed NarrativeLine release set is the 14 accepted RC modified tracked paths, nine original RC untracked paths, this 0.2.3 preparation and the RC/GO decision documents, plus seven release-preparation paths (`package.json`, `package-lock.json`, `src/components/AppFrame.tsx`, `tests/localePresentationCompletenessIntegration.test.js`, `README.md`, and the EN/JA Guides). The exact final stage list must be inspected before any authorized commit. E2R-SPEC Roadmap synchronization is a separate documentation worktree. Other E2R-SPEC untracked work, browser profiles, disposable Datasets, build output, Hub/LiaisonScape, public samples, Core/Extension/schema/Validator, and unrelated files are excluded. No file has been staged.

Exact NarrativeLine path set for pre-commit Human review (proposed, not staged):

| Origin | Paths |
| --- | --- |
| RC tracked edits (14) | `src/App.tsx`; `src/components/DatasetReplacementDialog.tsx`; `src/components/ModalDialog.tsx`; `src/index.css`; `src/screens/HomeScreen.tsx`; `src/screens/TimelineScreen.tsx`; `src/services/DatasetReplacementCopyService.ts`; `src/services/DatasetService.ts`; `src/services/SpecificationDeclarationService.ts`; `tests/DatasetReplacementCopyService.test.js`; `tests/ValidationService.test.js`; `tests/crossTabWorkspaceStrictModeIntegration.test.js`; `tests/detailBackConfirmationDialogIntegration.test.js`; `tests/timelineDatasetAcquisitionIntegration.test.js` |
| RC untracked paths (9) | `docs/current-dataset-diagnostic-detail-overflow-2026-10-27.md`; `docs/public-beta-f1-generated-metadata-declaration-2026-10-27.md`; `docs/public-beta-f2-and-diagnostics-presentation-2026-10-27.md`; `src/components/ImportFailureNotice.tsx`; `src/components/ImportWarningPresentation.tsx`; `src/services/AcceptedHandoffRecognitionService.ts`; `tests/AcceptedHandoffRecognitionService.test.js`; `tests/candidateWarningOwnershipIntegration.test.js`; `tests/generatedMetadataDeclarationIntegration.test.js` |
| Release metadata and guides (7) | `package.json`; `package-lock.json`; `src/components/AppFrame.tsx`; `tests/localePresentationCompletenessIntegration.test.js`; `README.md`; `docs/user-guide-en.md`; `docs/user-guide-ja.md` |
| Subsequent decision/preparation/review docs (4) | `docs/public-beta-rc-integrated-audit-2026-10-27.md`; `docs/public-beta-go-no-go-decision-preparation-2026-10-27.md`; `docs/public-beta-0.2.3-release-candidate-preparation-2026-10-27.md`; `docs/public-beta-0.2.3-pre-commit-review-2026-10-27.md` |

The E2R-SPEC `docs/roadmap.md` edit is not part of a NarrativeLine application commit. Its existing unrelated worktree hunks must be reviewed separately before any E2R-SPEC commit. This manifest identifies paths, not approved bytes or a final commit boundary; inspect each diff and the eventual staged set.

## Verification and remaining gates

The accepted RC audit's **404/404 tests, lint, build, E2R-SPEC validation and diff check** belong to the pre-metadata integrated source. The final local 0.2.3 verification result is recorded below after execution; it must not be inferred from the RC audit. Human Browser component acceptances remain bounded and unchanged. No new integrated Human Browser smoke is required by the adopted decision, although Human may request it for confidence.

Before a commit: retain the Human-selected 2026-10-27 JST date and approved release scope; review the exact changed/added paths and eventual staged diff, including the accepted RC files and only necessary documentation; use the final verification checkpoint below; then obtain explicit Staging and Commit authorization. Because the accepted RC lacked a byte manifest, use the current diff and review history to evaluate any functional drift. Do not treat a source change merely as a new SHA with automatic RC acceptance.

Before any Push or publication: Human must approve the **exact commit SHA and range**. A `main` push triggers `.github/workflows/deploy-pages.yml`: pinned E2R-SPEC checkout, `npm ci`, tests, lint, build, artifact upload and Pages deployment. CI/Pages success and served public HTTPS/version/Credits/assets must be checked for the approved SHA. Representative protected Handoff, warning ownership, diagnostics and retained-Dataset checks in a disposable public-browser environment are post-deployment evidence, not local preparation PASS. Public Beta formal publication closure requires a later Human decision.

Known exclusions remain: F2's first history repeat-prompt cause **INCONCLUSIVE**, actual Hub UI to local N4 untested, F1 post-reload ID not directly reread by Human, Cross-Context Workspace Safety overall unaccepted, and untested browser/peer/unknown Extension paths. No new claim is made for these from version preparation.

### Local verification checkpoint

After the 0.2.3 metadata, Credits, Guide and documentation edits, `npm.cmd test` **404/404 PASS**, `npm.cmd run lint` **PASS**, `npm.cmd run build` **PASS**, E2R-SPEC `npm.cmd run validate` **PASS**, and both repositories' `git diff --check` **PASS**. The suite includes the revised EN/JA Credits expectations. The package and root lockfile versions both read `0.2.3`; dependency versions were not changed. These are local automated results, not CI, deployed-asset, Codex Browser or Human Browser evidence. The final JST date replacement and any resulting source change require another proportionate verification before publication. No commit, push, deployment or publication was performed.

### Human-selected date and final local candidate

Human selected **2026-10-27 JST**. Credits and EN/JA Credits test expectations were changed from the provisional text to that date, with Application `NarrativeLine 0.2.3` and First release `2026-08-06` unchanged. Human separately reported a bounded integrated Edge Guest smoke on the pre-date-display local candidate; its Credits observation saw the provisional text, not the later date. The [pre-commit review](public-beta-0.2.3-pre-commit-review-2026-10-27.md) records the current source identity, final automated results and precise evidence boundary. Neither the selected date nor the local smoke establishes publication.
