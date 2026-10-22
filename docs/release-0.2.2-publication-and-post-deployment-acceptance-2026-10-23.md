# NarrativeLine 0.2.2 publication and bounded post-deployment acceptance

Date: 2026-10-23 (JST)

Current state: **PUBLISHED / PAGES DEPLOYMENT SUCCEEDED; PRODUCTION BROWSER
VERIFICATION PASS (BOUNDED); HUMAN ACCEPTED THE CODEX BROWSER EVIDENCE
(BOUNDED); FORMAL RELEASE CLOSURE PENDING FINAL HUMAN DECISION.**

This record concerns the published `0.2.2` application at
`3fb4f76076aaea1dde414a95e273d6fd85088825`. It follows the [local release
candidate checkpoint](release-candidate-0.2.2-preparation-2026-10-22.md),
which retains its preparation-time status, and the three separate local Human
Browser acceptance records linked below. It does not rewrite the [0.2.1
publication record](release-0.2.1-publication-and-post-deployment-verification-2026-10-19.md).

## Publication identity and evidence

| Item | Evidence and boundary |
| --- | --- |
| Application | NarrativeLine `0.2.2` at [the public Pages URL](https://sukoyaka-dopeness.github.io/e2r-narrative-line/) |
| Published source | `3fb4f76076aaea1dde414a95e273d6fd85088825`; `origin/main` and the observed GitHub `main` point to this SHA at this recording checkpoint |
| Authorized range | Seven commits from the prior published `0.2.1` SHA `54bc709b695b98de382c75e90459fd53cd85caff`; see the local candidate record for the three feature commits and separate metadata commits |
| GitHub Actions | [Run 39801147556](https://github.com/sukoyaka-dopeness/e2r-narrative-line/actions/runs/39801147556) completed successfully for the published SHA. Its tests, lint, build, artifact upload, and Pages deployment steps succeeded. This run was inspected during this documentation checkpoint; it was not rerun. |
| Deployment date | The publication checkpoint reported Pages deployment success at **2026-10-23 00:08:19 JST**. This timestamp is retained from that earlier publication evidence, not newly measured here. |
| Credits | The public browser verification reported Application `NarrativeLine 0.2.2`, First release `2026-08-06`, and Updated `2026-10-23`. The approved deployment day and Updated day agree. |
| Served assets | The earlier publication check reported SHA-256 equality between the served JS/CSS and the production build of the authorized source. This was not repeated for this acceptance recording. |

The [three local Human Browser acceptance records](#evidence-and-acceptance-boundaries)
preceded publication. The production checks below were performed by Codex
through official Browser Use in Microsoft Edge's dedicated **検証用プロファイル**.
Human accepted the reported bounded Codex Browser evidence on 2026-10-23.
Human did not thereby perform a new production browser test personally.

## Human-accepted production Browser Use evidence

The final successful check is identified as
`NL-0.2.2-POST-DEPLOYMENT-BROWSER-VERIFY4-RESUME`. Earlier
`NL-0.2.2-POST-DEPLOYMENT-EDGE-VERIFY1` and
`NL-0.2.2-POST-DEPLOYMENT-BROWSER-VERIFY2/3` attempts remained **BLOCKED**
at their original checkpoints because a safe browser-control connection could
not be established. The later Browser Use PASS supplements rather than erases
those historical observations.

| Released change | Codex's public-browser observation accepted by Human |
| --- | --- |
| History 2 same-day order | Berlin Wall **EN Dataset** and **JA Dataset** each displayed 15 Events. Both public Timelines showed the 1989-11-09 Events in the order **18:53 → 20:00 → 21:20**, without observed missing or duplicate cards in the reviewed set. Dataset language was distinguished from UI locale. |
| Event Detail FIX2 | With an unsaved edit and English UI, the effective viewports were **601×700px** and **390×700px**, measured after resizing only the verification-profile Edge window. At the scroll end, the whole Delete Event button was visible above the fixed footer at both widths, and its center resolved to Delete Event rather than Back/Discard. At 390px, Tab and Shift+Tab preserved the expected focus order and visibility. At both widths, clicking Delete Event opened the intended confirmation; **Keep Event** canceled it and focus returned to Delete Event. No Event was deleted or saved. |
| Ko-fi Home link | EN and JA labels were correct; the link followed GitHub Sponsors below the primary Dataset actions. At **390×700px** neither locale showed horizontal overflow or broken layout. The link target was `https://ko-fi.com/sukoyaka_dopeness`, and the earlier Codex Browser operation reached it in a new tab. No donation, login, or payment was performed. |

Browser Use's viewport override had earlier been accepted without changing the
actual page width. For the completed responsive check, the dedicated Edge
window was resized and `innerWidth` was read from the rendered page; the
original window bounds were restored afterward. No ordinary user profile,
saved Dataset, or existing Workspace was used. The verification-only unsaved
text was reverted without saving. The final public tab's captured error log
contained no errors.

This acceptance does **not** establish all-browser compatibility, a separate
mouse-wheel scrolling check, actual Event deletion, every viewport or footer
label configuration, the full History 2 Candidate semantics, or Validator
acceptance. Reaching the scroll end and keyboard navigation were observed;
unperformed actions are not recorded as PASS.

## Evidence and acceptance boundaries

| Evidence or decision | Status for `0.2.2` |
| --- | --- |
| [History 2 local Human Browser acceptance](history-2-same-day-timeline-order-human-acceptance-2026-10-22.md) | **PASS — LOCAL / BOUNDED** for Berlin Wall EN/JA and the three same-day Events; not a production result. |
| [Event Detail FIX2 local Human Browser acceptance](event-detail-fixed-footer-occlusion-human-acceptance-2026-10-22.md) | **PASS — LOCAL / BOUNDED** for the reviewed widths, dirty state, and safe confirmation behavior; not a production result. |
| [Ko-fi Home local Human Browser acceptance](kofi-home-link-human-acceptance-2026-10-22.md) | **PASS — LOCAL / BOUNDED** for EN/JA normal and narrow Home presentation; not a production result. |
| Publication and Pages deployment | **SUCCEEDED** for the exact published SHA, independently of browser interaction acceptance. |
| Codex production Browser Use verification | **PASS (BOUNDED)** for the three released changes under the cases above. This is agent-operated evidence. |
| Human acceptance of that Codex evidence | **ACCEPTED (BOUNDED)** on 2026-10-23, by explicit Human decision. It does not create a new Human-operated production Browser PASS. |
| NarrativeLine `0.2.2` Formal Release Closure | **PENDING FINAL HUMAN DECISION.** No closure is declared by this record or its local commit. |

## Formal Release Closure candidate for Human decision

The exact `0.2.2` publication SHA, successful tests/lint/build and Pages
deployment, published application/credits identity, bounded production
Browser Use PASS, and Human acceptance of that evidence support a **bounded
Formal Release Closure candidate** for these three released changes. No new
runtime, Dataset, or specification defect was identified in the reviewed
production paths. The Human may decide whether to close this release within
the explicit limits above; this document makes no final closure decision.

The following are outside the proposed closure: all History 2 precision,
time-zone, or multiple-assertion conditions; all Event Detail widths and
scrolling methods; actual Event deletion; exhaustive browser/assistive
technology compatibility; all Dataset/Workspace replacement and cross-context
safety paths; other E2R applications; and Candidate-to-Stable promotion.
The `docs/ui-spec.md` Back-position discrepancy and the shared favicon
follow-up are independent maintenance items, not findings from this bounded
production check.

An earlier `0.2.1` release-candidate record called for a network-capable
production-dependency advisory check. No completed advisory result for this
`0.2.2` recording was found in the reviewed release documents. A fresh
`npm audit --omit=dev --audit-level=high` attempt at this documentation
checkpoint could not reach the npm advisory endpoint; its result is **NOT
VERIFIED**, not a security PASS. The prior exact-SHA publication authorization
and successful deployment are historical facts; the Human should explicitly
decide whether this outstanding advisory evidence is required before Formal
Release Closure. No vulnerability conclusion follows from the failed request.

The current E2R-SPEC Roadmap and E2R Knowledge updates are separate follow-up
work. This local NarrativeLine documentation checkpoint neither publishes
those repositories nor extends their acceptance decisions. A later push of
this documentation commit would trigger the existing Pages workflow and needs
separate Human authorization; it is not part of this record.
