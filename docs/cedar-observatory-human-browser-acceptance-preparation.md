# Cedar Observatory Human Browser Acceptance preparation

Date: 2026-09-30

Status: **READY FOR HUMAN REVIEW — NOT ACCEPTED / NOT RELEASED**

## Local entry

The NarrativeLine Vite app uses `/e2r-narrative-line/`; `#locale=en` and
`#locale=ja` request the corresponding UI language. Home provides separate
`Open Cedar Observatory showcase` / `シダー天文台の例を開く` actions and opens the
locale-specific [EN](../src/sample/cedar-observatory-showcase.en.e2r.json)
or [JA](../src/sample/cedar-observatory-showcase.ja.e2r.json) Dataset through
the existing replacement path. A saved conflicting locale can present the
existing language-choice dialog; choose the requested language before opening
the showcase. Changing UI language later does not translate the active Dataset.

The accepted `#datasetUrl=` Handoff contract requires a fetchable HTTPS
Dataset URL without embedded credentials. These local, unpushed files have no
such URL. The HTTP dev server or `file:` path is therefore **not** a valid
direct-open fragment. No test-only route or Handoff exception was added.
Exact ephemeral dev ports belong in the current Human handoff message, not in
a permanent application contract.

## Compact Human check

1. Open both locale URLs; from each Home screen open Cedar. Check story,
   names, descriptions, Home hierarchy, ordinary and narrow width.
2. In the twelve-Event Timeline, check the Recorded sequence from May 14
   decision through May 21 volunteer roles, June 4 route plan, June 12 safety
   walk, June 20 afternoon briefing and welcome desk, opening, and closing.
   Check undated dome preparation and telescope check with qualitative
   before/after; invitations' **June 2026 month** Candidate from next calendar
   month; and sky tour's **June 20 20:00** Candidate from two elapsed hours
   after opening.
   Expand Candidate disclosures and compare them with Recorded History. Open
   relevant Event Details to inspect the recorded Relation and candidate basis.
3. In LiaisonScape, open either exact Cedar JSON file using **Open E2R
   Dataset**. Inspect the six-Entity/six-edge graph. In **Validation
   diagnostics** / **検証診断**, inspect the warning code
   `specification_version_unsupported` at
   `/extensions/draft.github.sukoyaka-dopeness.specification/uses/2/version`.
   Verify the graph remains open. The warning is expected from the currently
   pinned Validator 0.6.0; its later update is a separate checkpoint.

Report **PASS** or the screen, locale, viewport, Event, and observed defect.
This packet does not decide Human Browser Acceptance. Cedar remains an
application-owned candidate, not a canonical cross-app or Gallery sample.
No public write or release transaction is part of this preparation.
