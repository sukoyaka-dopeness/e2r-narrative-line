# NarrativeLine Public Beta 0.2.3 — pre-commit Human review (2026-10-27)

Status: **FINAL LOCAL CANDIDATE VERIFIED / PRE-COMMIT HUMAN REVIEW PENDING / NO STAGING, COMMIT OR PUBLICATION**. Human selected **CONDITIONAL GO (BOUNDED)**, version **0.2.3**, and release date **2026-10-27 JST**. The date is selected; publication has not occurred. Published version remains **0.2.2**.

## Authority and candidate identity

The [RC integrated audit](public-beta-rc-integrated-audit-2026-10-27.md) identifies the accepted RC as HEAD `bb38fa904a38404845ec7afe097bf0dd2072e487` **plus** 14 modified tracked and nine then-untracked files. The RC is **RC HUMAN ACCEPTED (BOUNDED)**; N4, F2, Diagnostics Presentation and F1 each retain their independent bounded Human closure. The [GO decision preparation](public-beta-go-no-go-decision-preparation-2026-10-27.md) and [release preparation](public-beta-0.2.3-release-candidate-preparation-2026-10-27.md) record the later Conditional GO, version and release metadata. There was no audit-time byte manifest: matching paths and current regression results cannot prove byte-for-byte identity to the accepted RC.

After RC acceptance, the application changes for release preparation are version/package metadata, EN/JA Credits and its test expectations, README and EN/JA Guides. The final date edit changes Credits `Updated` from the historical pending placeholder to `2026-10-27`; `Application: NarrativeLine 0.2.3` and `First release: 2026-08-06` remain. No accepted functional logic, Validator version, public Dataset or Handoff contract was changed for the date decision. If publication moves to another JST date, Human must reconsider the displayed date and the changed source must be reverified before push.

For a compact current-state fingerprint, SHA-256 was computed over a sorted `path hash` manifest of 27 Runtime, test, metadata, Guide and README files (the 14 RC tracked paths, six RC untracked Runtime/test paths, and seven release metadata/Guide paths listed in the release preparation record). UTF-8 lines joined with LF yield composite SHA-256 `5d217e3f8f605dbdc928f05d8dc5f3863c1f2773bd96b773d0e960cb5f2ab305`. This identifies **this local candidate only**; it is not a retroactive RC fingerprint or a Git commit hash. Recalculate if any listed file changes.

## Human-reported integrated Browser smoke

Human reported direct use of isolated Microsoft Edge Guest on the local 0.2.3 candidate on 2026-10-27. Submitted screenshots and Export JSON were described by Human; they were **not directly accessible for Codex inspection in this review**. The following are bounded Human reports, not Codex Browser checks or new formal acceptance:

| Area | Human-reported observation | Boundary |
| --- | --- | --- |
| Credits | JA/EN showed 0.2.3 and First release 2026-08-06 without a material display issue. | Smoke preceded the final date edit and showed the provisional release-date wording; the final `2026-10-27` display has automated test coverage, not a new Human Browser check. |
| Create, save, reload | `RC 0.2.3 動作確認` with Event `動作確認イベント` survived save/reload; no unnecessary Metadata warning. | Human PASS for this disposable Dataset and sequence. |
| Export | An E2R JSON file was acquired; Human checked its title, Event and generated Metadata 1.0.0 Specification declaration. | Human PASS; Codex did not inspect the actual file. |
| Invalid JSON Import | `json_parse_error` import failure was distinguished from Current Dataset information; title and Event were retained. | Human PASS for the tested invalid JSON and Current Dataset. |
| Handoff Cancel | Saved Current Dataset prompted for replacement; Cancel retained its title and Event. | Human PASS (BOUNDED). |
| Handoff Accept/reload | Human accepted Cedar Observatory, edited and saved its title, reloaded the same Handoff URL without a repeat prompt, and retained the edited title and 12 Events. | Human PASS (BOUNDED); public Dataset URL into local receiver, not actual Hub UI click into local N4. The older F2 history repeat-prompt cause remains INCONCLUSIVE. |
| Diagnostics | Cedar Dimension Assessment 0.2.0 produced `unknown_extension` and `specification_unavailable`. | Known legitimate Validator 0.7.0 diagnostics; no suppression or new Extension recognition in 0.2.3. |

This smoke adds confidence for those actions only. It does not broaden bounded RC or component acceptances to other browsers, failure timings, unknown Extension edits, all cross-context safety, or public HTTPS behavior.

## Exact proposed commit boundary

The [release preparation manifest](public-beta-0.2.3-release-candidate-preparation-2026-10-27.md#local-023-release-delta) names every path. The proposed **NarrativeLine application commit** contains **34 exact paths**: 14 accepted-RC tracked edits, nine original accepted-RC untracked Runtime/test/evidence paths, seven later release metadata/Guide paths, and four later RC/GO/release/review documents. The last group includes this review document. These 34 paths are the recommended application commit scope, subject to Human review of their actual bytes and a later exact staged diff. No path is staged now.

Exclude `docs/recognized-unsupported-extension-design-and-compatibility-2026-10-27.md`: it records a separately adopted future design direction, not 0.2.3 implementation. Exclude E2R-SPEC `docs/roadmap.md` from the NarrativeLine application commit; its current dirty state includes separate documentation work. Also exclude other E2R-SPEC untracked files, disposable browser profiles/Datasets, build output, public samples and other applications. Any E2R-SPEC publication/synchronization needs a separately reviewed exact scope. Do not use broad staging.

At final inventory the NarrativeLine worktree has 21 modified tracked files and 14 untracked files: 13 proposed release paths plus the one future design document. The current HEAD alone is not this candidate. The proposed set is path-identifiable, but no final staged tree or commit SHA exists. A future approved staging step must inspect the precise staged content, `git diff --cached --name-status`, `git diff --cached --check`, and relevant gates before an approved commit. Push of `main` can initiate Pages deployment and requires a separate Human authorization for the exact commit SHA and range.

## Final local verification and remaining decisions

After the final release-date source/test edit, current-source `npm.cmd test` passed **404/404**, `npm.cmd run lint` passed, `npm.cmd run build` passed, and E2R-SPEC `npm.cmd run validate` passed. Both repositories' `git diff --check` passed. The Git inventory shows 21 modified tracked and 14 untracked NarrativeLine paths, and one modified tracked (`docs/roadmap.md`) plus ten preserved untracked E2R-SPEC paths. These are local automated and source checks, distinct from the RC audit checkpoint, Human Browser evidence, CI, deployed asset verification and publication.

No confirmed new functional release blocker was identified in this date and evidence review. Known bounded exclusions remain: F2's initial history repeat-prompt cause **INCONCLUSIVE**; actual Hub UI to local N4 untested; post-reload F1 datasetId not directly reread by Human; Cross-Context Workspace Safety overall unaccepted; and untested browser, peer-conflict, failure and external/unknown Extension paths. The new Human smoke is an optional confidence check under the adopted Conditional GO, not a newly imposed gate.

**Pre-commit recommendation:** Ready for Human review of the exact 34-path NarrativeLine release scope, with the byte-identity limit and exclusions above. Human must separately authorize staging and commit. Before push/publication, the resulting exact commit SHA/range, CI/Pages result, live HTTPS/version/Credits/assets and bounded public behavior need their own review and authorization. Conditional GO and the selected date do not grant commit, push, deployment or publication authority.
