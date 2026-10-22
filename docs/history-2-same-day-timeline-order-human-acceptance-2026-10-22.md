# History 2.0 same-day Timeline ordering — bounded local Human acceptance (2026-10-22)

Status: **NL-H2-SAME-DAY-ORDER-HUMAN-ACCEPTANCE1 PASS — LOCAL / BOUNDED**. The correction and this record are local and uncommitted at this checkpoint. The published NarrativeLine `0.2.1` revision `54bc709b695b98de382c75e90459fd53cd85caff` has not received this correction. This is not public deployment, production verification, or NarrativeLine-wide release closure. The E2R-SPEC Roadmap remains the current planning authority.

## Audit and bounded correction

The Hub `0.3.0` public HTTPS Berlin Wall EN handoff acquired and displayed 15 Events, but the published NarrativeLine Timeline displayed the 1989-11-09 Events in the order 20:00 → 21:20 → 18:53. The Hub Formal Publication Closure kept this NarrativeLine defect as an **UNRESOLVED / NON-BLOCKING FOLLOW-UP** for that public revision.

`NL-H2-SAME-DAY-ORDER-AUDIT1` traced the baseline Timeline order to `PerspectiveOrderingService` and `HistoryService`. Berlin Wall EN/JA have neither an authored Perspective display order nor `temporalOrder` for these Events. The comparison read History 2 dates but obtained same-day hour, minute, and second only through the History 1 path, so Event ID broke the tie. The EN/JA sample positions independently record `travel-announcement` at 18:53, `ard-report` at 20:00, and `first-crossing` at 21:20, all on 1989-11-09 in `Europe/Berlin` with `+01:00`.

`NL-H2-SAME-DAY-ORDER-FIX1` makes supported single-position History 2 time fields available to the existing Civil Time comparator in `src/services/HistoryService.ts`. It does not alter Core, Extension, Schema, or Dataset files; History 1 comparison, authored `temporalOrder`, Perspective display order, and existing fallback remain separate. It does not add instant ordering across time zones or semantics for multiple History 2 assertions.

## Verification evidence, kept separate

- **Source / automated:** `tests/History2TimelineOrdering.test.js` directly covers Berlin Wall EN/JA, hour/minute/second comparison, mixed precision, missing time, date boundaries, fallback, History 1, `temporalOrder`, and Perspective display order. Three new regression cases failed before the correction; they passed after it. The Codex implementation run reported 375/375 tests, lint, production build, and `git diff --check` PASS. The 375-test result was for the whole worktree and included the separate Event Detail FIX2 changes; it was not an isolated History 2-only run.
- **Codex Browser:** No new Codex Browser PASS is claimed for this acceptance checkpoint. The public Browser Use observation established the old incorrect order; it does not verify the local correction.
- **Human Browser:** Human used Microsoft Edge InPrivate with local NarrativeLine `0.2.1` and separately opened the Berlin Wall EN and JA Datasets. Human reported 15 Events for each; JA showed Japanese Event names from the JA Dataset, rather than EN data under a Japanese UI. In both Timelines, Human confirmed `travel-announcement` 18:53 → `ard-report` 20:00 → `first-crossing` 21:20. Human submitted EN/JA screenshots and judged this limited local review PASS. This record uses the Human report; it does not claim a fresh independent inspection of the screenshots.

The earlier Event Detail FIX2 local Human Browser acceptance is independent and unchanged. Its statement that History 2 Human review was pending describes that earlier checkpoint; this later decision closes only the bounded local History 2 review.

## Acceptance boundary and remaining gates

Human accepted the corrected displayed order and 15-Event presentation in the two local Berlin Wall Datasets. This does not accept every History 2 precision, time-zone, or multiple-assertion case; the History 2 Candidate as a whole; an application-wide regression; or a published correction. The public `0.2.1` ordering issue remains until a separately approved commit, push, deployment, and public verification. The adopted Ko-fi Home link is another independent workstream.

Before publication, Human must separately approve the exact commit and release range, any other included changes, push and deployment, and subsequent production verification. Current local HEAD is not an acceptance-source SHA for the uncommitted correction.
