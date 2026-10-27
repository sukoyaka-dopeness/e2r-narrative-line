# NarrativeLine Public Beta 0.2.3 publication and bounded Human acceptance

Date: 2026-10-27 JST

Current state: **PUBLICATION DEPLOYED / PUBLIC HTTPS VERIFIED (BOUNDED) / HUMAN ACCEPTED / CLOSED (BOUNDED)**. Human formally approved this Publication Closure on 2026-10-27 JST. This record concerns the published `0.2.3` application and the evidence below; it does not close untested paths or authorize another release operation.

## Published identity and authority

| Item | Accepted identity |
| --- | --- |
| Repository and branch | `sukoyaka-dopeness/e2r-narrative-line`, `main` |
| Release commit | [`2958d546dcabad73544d4c9639566c8197bdb98a`](https://github.com/sukoyaka-dopeness/e2r-narrative-line/commit/2958d546dcabad73544d4c9639566c8197bdb98a) |
| Parent and authorized range | `bb38fa904a38404845ec7afe097bf0dd2072e487..2958d546dcabad73544d4c9639566c8197bdb98a`; exactly one commit and the 34 approved files |
| Version and publication date | `0.2.3`; 2026-10-27 JST |
| Public application | [GitHub Pages HTTPS](https://sukoyaka-dopeness.github.io/e2r-narrative-line/) |
| Workflow and deployment | [Actions run 40509103531](https://github.com/sukoyaka-dopeness/e2r-narrative-line/actions/runs/40509103531); [Pages deploy job 122205974735](https://github.com/sukoyaka-dopeness/e2r-narrative-line/actions/runs/40509103531/job/122205974735) |

Human separately accepted the [integrated RC](public-beta-rc-integrated-audit-2026-10-27.md#formal-human-rc-acceptance--2026-10-27) and adopted [CONDITIONAL GO (BOUNDED)](public-beta-go-no-go-decision-preparation-2026-10-27.md#subsequent-human-decision--2026-10-27). The [release preparation](public-beta-0.2.3-release-candidate-preparation-2026-10-27.md) and [pre-commit review](public-beta-0.2.3-pre-commit-review-2026-10-27.md) retain their then-current local and pending statuses as historical checkpoints. The N4, F2, Diagnostics Presentation and F1 bounded Human closures remain independent and are not enlarged by this publication decision. The accepted RC had no audit-time byte manifest; this later exact commit identifies the released source, but does not retroactively prove byte identity to that earlier dirty worktree.

## Technical publication evidence, separate from Human Browser use

Codex confirmed immediately before the authorized push that remote `main` pointed to the specified parent and that the publication date was still 2026-10-27 JST. The ordinary one-commit push moved remote `main` to the release SHA. The named Actions run for that SHA completed successfully, including dependency install, CI tests, lint, build, artifact upload and Pages deployment. The GitHub Pages deployment status was `success` and identified the public URL above.

The public HTTPS entry page returned HTTP 200. Its JS, CSS and favicon each returned HTTP 200 and matched the verified local production build byte-for-byte by SHA-256. The served JS contained `NarrativeLine 0.2.3`, `2026-08-06` and `2026-10-27`; these are asset checks, not a rendered-browser observation. The [English Guide](https://github.com/sukoyaka-dopeness/e2r-narrative-line/blob/2958d546dcabad73544d4c9639566c8197bdb98a/docs/user-guide-en.md) and [Japanese Guide](https://github.com/sukoyaka-dopeness/e2r-narrative-line/blob/2958d546dcabad73544d4c9639566c8197bdb98a/docs/user-guide-ja.md) were retrievable from the release commit. Codex did not perform a public interactive Browser Use check in this technical verification.

## Human-operated public Browser smoke and formal decision

Human reported a direct public-HTTPS check on 2026-10-27 JST in an isolated Microsoft Edge Guest environment: **9/9 PASS (BOUNDED)**. This is Human-operated Browser evidence, not Codex-operated Browser Use. Screenshots and the actual Export JSON were described by Human; Codex did not directly inspect those submitted artifacts for this record. A screenshot supports the visible state it shows; actions such as reload, Cancel and successful download also rely on Human's operation report.

| Check | Human-reported bounded result |
| --- | --- |
| 1. Public startup | The public application opened. |
| 2. EN/JA Credits | Both locales passed. English displayed `Application: NarrativeLine 0.2.3`, `First release: 2026-08-06`, `Updated: 2026-10-27`. |
| 3. New Dataset | Creation passed. The reported title was `Public 0.2.3 検証` and there was one Event, `公開テストイベント`. |
| 4. Save and reload | The tested Dataset and Event were retained. |
| 5. E2R JSON Export | Human reported acquiring and checking the real JSON: title, one Event, `datasetId`, and Specification declaration for Metadata `1.0.0`. |
| 6. Invalid JSON Import | `json_parse_error` was shown and the Current Dataset remained. |
| 7. Handoff Cancel | Replacement confirmation appeared and Cancel retained Current. |
| 8. Handoff acceptance and reload | Cedar Observatory was accepted; 12 Events were displayed after the reported sequence. This does not by itself establish every F2 recognition condition or resolve the earlier history repeat-prompt cause. |
| 9. Diagnostics | The Cedar diagnostics were visible. Validator `0.7.0` legitimately reports `unknown_extension` and `specification_unavailable` for Dimension Assessment `0.2.0` under the released capability. |

Human explicitly adopted **HUMAN ACCEPTED / CLOSED (BOUNDED)** for this exact published version, successful technical deployment and reported public Browser smoke. This is Formal Publication Closure, separate from the earlier RC and Conditional GO decisions. No tag, GitHub Release, later push or additional deployment is implied.

## Limits and follow-up

This Closure leaves the first F2 history-return repeat-prompt cause **INCONCLUSIVE**. Cross-Context Workspace Safety as a whole remains unaccepted. Untested browsers, peer-conflict and failure timing, full unknown-Extension editing/saving preservation, Dimension Assessment `0.2.0` recognition and semantic validation, and detailed accessibility paths remain outside this bounded acceptance. The smoke does not establish an actual public Hub UI click path to the receiver or byte-for-byte identity of every saved Dataset. Known Validator diagnostics were not suppressed or reclassified.

**README follow-up is required separately.** The published README still calls `0.2.3` uncommitted/unpublished and `0.2.2` the published release. That is stale after this publication. Human excluded README editing, staging, committing and pushing from the present Closure-record authorization; perform that synchronization only under a separate approved scope. Earlier candidate and preparation documents' pending/unpublished statements remain valid descriptions of their historical checkpoints and are not rewritten here.

This documentation record is a local, uncommitted follow-up until separately authorized. Its existence does not change the already deployed release commit, public assets, or the scope of Human's publication acceptance.
