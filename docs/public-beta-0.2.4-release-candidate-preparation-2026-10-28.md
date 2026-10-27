# NarrativeLine Public Beta 0.2.4 — local RC preparation

Date: 2026-10-28 JST

Status: **VERSION 0.2.4 / RC HUMAN ACCEPTED (BOUNDED) / RELEASE DATE 2026-10-28 JST HUMAN-SELECTED / RELEASE AUTHORIZED**. Human formally accepted the bounded Cedar RC and authorized its exact Manifest for Commit, Push, existing Pages deployment and bounded post-deployment verification. Publication verification is recorded separately below after deployment. The previous published application source was `0.2.3`, release commit `2958d546dcabad73544d4c9639566c8197bdb98a`; local parent before this release was `27bd132e4f24836eed346c7224317750279b8c50`.

## Scope and evidence

Human independently accepted the bounded [Cedar Sample warning UX local candidate](cedar-sample-warning-ux-local-candidate-2026-10-28.md#subsequent-formal-human-decision--2026-10-28-jst) on 2026-10-28 JST. The [cross-app RC readiness audit](../../e2r-spec/docs/cross-app/cross-app-sample-dataset-warning-ux-rc-readiness-audit-2026-10-28.md) identified nine app paths for this implementation. The current RC scope is those nine paths plus eight release-preparation paths below. The two apps have separate RC and publication decisions. The original Browser Review, automated tests and metadata preparation are separate evidence. Human formally accepted this bounded 17-path RC on 2026-10-28 JST; this does not extend the earlier Cedar feature acceptance bounds.

| Group | Exact local RC paths |
| --- | --- |
| Accepted implementation and test (9) | `src/App.tsx`; `src/components/DatasetReplacementDialog.tsx`; `src/components/ImportWarningPresentation.tsx`; `src/components/ModalDialog.tsx`; `src/index.css`; `src/screens/TimelineScreen.tsx`; `src/services/KnownSampleExtensionNotice.ts`; `tests/KnownSampleExtensionNotice.test.js`; `docs/cedar-sample-warning-ux-local-candidate-2026-10-28.md` |
| Version and publication preparation (8) | `package.json`; `package-lock.json`; `src/components/AppFrame.tsx`; `tests/localePresentationCompletenessIntegration.test.js`; `docs/user-guide-en.md`; `docs/user-guide-ja.md`; `README.md`; this RC record |

**Accepted RC manifest: 17 exact paths**, including implementation/test/record files. `docs/recognized-unsupported-extension-design-and-compatibility-2026-10-27.md` is an independent future-design record and excluded. E2R-SPEC's Roadmap/audit and other repositories are outside this app commit. Build output and disposable browser data are excluded.

## Release identity

`package.json` and the root `package-lock.json` identify `0.2.4`; dependencies, including published Validator `0.7.0`, are unchanged. EN/JA Credits display NarrativeLine `0.2.4`, preserve First release `2026-08-06`, and now show the Human-selected Updated date `2026-10-28`. The EN/JA Credits test matches. The date selection is not publication evidence; deployment must be verified independently.

EN/JA User Guides explain the official Cedar-only Additional information, the bounded preservation evidence, exact technical detail, Current/Candidate separation and independent failure notices. README identifies the accepted `0.2.4` release and points here for scope and publication evidence. Earlier `0.2.2` and `0.2.3` publication/acceptance records remain historical and unchanged. This record distinguishes RC acceptance from deployment verification and formal Publication Closure.

## Safety, verification and decision boundary

The accepted Runtime diff is limited to known official-sample informational recognition, compact disclosure, Candidate/Current presentation and bounded focus/spacing adjustment. Validator Code/Severity/Path remain available; matching an ID/version is not semantic validation. There is no change to Dataset save, Export, Handoff or replacement algorithms, public sample JSON, schema, Core or Extensions. Unknown/changed data and operation failures do not receive the known-sample assurance. The existing `0.2.3` Publication Closure remains in force for its own source only.

Final local verification, CI, Pages deployment, and served-HTTPS evidence are recorded in the release verification section below. Automated/source results are distinct from Human Browser evidence. The exact 17-path RC was accepted within its stated bounds. The existing Pages workflow was inspected and still runs `npm ci`, tests, lint, build and Pages deployment on `main` push; its definition was not changed. Formal Publication Closure remains a separate Human decision.

Residual exclusions include the first no-entry observation's unknown cause; arbitrary or modified Extension payloads; mismatched declaration/version and mixed diagnostics; all edit/save/Export preservation paths; semantic Dimension Assessment validation; untested browsers, viewports and accessibility settings; broader Cross-Context Workspace Safety; and the historical F2 repeat-prompt uncertainty. No new release blocker was confirmed in the bounded accepted feature scope. Any failed final gate or confirmed data-safety defect must be returned to Human before RC acceptance.
