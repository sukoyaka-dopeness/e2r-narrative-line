# Current Dataset diagnostic detail overflow — local candidate

Date: 2026-10-27 JST

Status: **LOCAL PRESENTATION CORRECTION / HUMAN ACCEPTED / CLOSED (BOUNDED VISUAL SCOPE) / UNCOMMITTED**

Human observed that Cedar Observatory JA at 360 px clipped long Code/Path strings after expanding `診断詳細` in the Current Dataset Timeline's `読み込み情報`. This is distinct from the N4 Candidate replacement dialog and does not change warning ownership.

`src/index.css` now permits wrapping throughout `.import-information` and specifically in its `code` elements. The browser check found that wrapping only `code` left the ordinary summary list's long Path clipped, so the panel-level rule was also needed. No diagnostic item, Code, Path, Severity, Extension identifier, validation result, Dataset state, or replacement/Handoff behavior was changed. The pre-existing uncommitted N4 CSS and Runtime changes were retained.

Validation: `npm.cmd test` **381/381 PASS** on the integrated local N4 candidate before the final panel-level CSS addition; `npm.cmd run lint` and `npm.cmd run build` **PASS** again after that addition. A local browser check used the formal Browser Use connection to the isolated Edge profile and the uncommitted N4 Vite server. At 360 px with Cedar EN and JA accepted, both long diagnostic strings were present in the expanded detail and wrapped inside the panel; the ordinary summary also wrapped. For EN, panel `scrollWidth = clientWidth = 309`; for JA, `scrollWidth = clientWidth = 324`. Document `scrollWidth` did not exceed viewport width. Enter closed and reopened the JA disclosure with focus retained on `summary`. Screenshot evidence is in `workspace/n4-browser-20261026-codex/n4-diagnostics-en-360-20261027.png` and `n4-diagnostics-ja-360-20261027.png`. These earlier Codex checks alone did not establish Human Browser Acceptance, all widths, assistive-technology behavior, or a deployed result.

## Subsequent Human visual review — 2026-10-27

Human inspected Cedar JA Current Dataset diagnostics in the corrected local NarrativeLine at JA/EN 390 px and JA/EN 360 px. Human reported **PASS** for complete reading of `unknown_extension` and `specification_unavailable` Code/Path, wrapping of long Extension identifiers, no clipping beyond the purple Diagnostics panel, and retention of the correction after locale switching. This is the Timeline Current Dataset surface; it does not accept the N4 Candidate dialog. Screenshot-based visual confirmation is distinct from the earlier Codex-operated browser checks and automated tests. Detailed Human keyboard, focus, scrolling, assistive-technology, and other-width checks were not performed.

## Formal Human decision — 2026-10-27

Human formally accepted and closed the **visual correction at JA/EN 360 px and 390 px** described above on NarrativeLine HEAD `bb38fa904a38404845ec7afe097bf0dd2072e487` plus uncommitted corrections. This is the Timeline Current Dataset diagnostics surface only. Human did not accept detailed keyboard, focus, scrolling, assistive-technology, other-width, or N4 Candidate-dialog behavior through this decision. No Commit, Push, deployment, or safety-state change occurred.
