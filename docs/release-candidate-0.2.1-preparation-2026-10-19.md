# NarrativeLine 0.2.1 local release candidate preparation

Date: 2026-10-19

This record preserves the local candidate and Human review decisions at the
time they were made. The subsequent public release and current
post-deployment verification status are in the
[2026-10-19 publication record](release-0.2.1-publication-and-post-deployment-verification-2026-10-19.md).

Preparation status: LOCAL CANDIDATE / HUMAN BROWSER REVIEW PENDING

Current decision (2026-10-19): HUMAN ACCEPTED / CLOSED (BOUNDED) for the
0.2.1 release-candidate Human Browser Review; PUBLIC RELEASE NOT AUTHORIZED

## Human selection and source boundary

Human selected application version `0.2.1` and all 12 local commits after
published `main` `eb583720df89797a1acf682b5cea747bc25e0cc6`, including
the Cedar Observatory EN/JA Dimension Assessment update, for the next release
candidate. The starting local `main` HEAD was
`e35dd60347a831df92469d55c48fb74079df2a62`; its worktree was clean.
This preparation added version, Credits, documentation, and one Credits
expectation update on top of that HEAD. The preparation-time HEAD alone did
not identify the complete candidate. The exact public release revision and
the public write remain separate Human decisions. No `0.2.1` deployment is
claimed.

The selected commits cover Entity deletion documentation, backdrop and More
hover UI corrections, Cedar Dimension Assessment content, cross-tab workspace
and Dataset replacement protection, startup save/Resume coordination, bounded
export filenames, and the [accepted startup revision-race repair](startup-dataset-revision-race-fix-2026-10-19.md).
The latter's pre-fix silent R1/R2 overwrite remains a confirmed historical
defect; its bounded repair is HUMAN ACCEPTED / CLOSED. The `0.2.1` application
version does not change E2R Core, Extension, schema, Validator `0.7.0`, or the
Dimension Assessment Candidate `0.2.0` maturity.

The package and lockfile say `0.2.1`. Credits say `NarrativeLine 0.2.1`,
`First release: 2026-08-06`, and `Updated: 2026-10-19` in EN/JA. Here the
updated date identifies candidate preparation; it is not a published release
date. Confirm the date against the actual release revision before publication.
The [UI specification](ui-spec.md) and [EN](user-guide-en.md) / [JA](user-guide-ja.md)
guides describe this candidate's display and recovery behavior.

## Cedar and downstream effect

Both NarrativeLine-owned Cedar files retain their `0.2.0` Core content:
Entities, Events, and Relations compare equal to the published-main copies.
Each updated locale has six Entities, 12 Events, 28 Relations, and four
Dimensions with 15 Assessments declared as Dimension Assessment Candidate
`0.2.0`. The current tests import, validate, preserve, and open both files;
unknown-Extension / specification-unavailable warnings remain legitimate.
NarrativeLine preserves this payload but does not provide native Assessment
editing. The [Cedar disposition](cedar-observatory-showcase-release-candidate.md)
tracks the content adoption and bounded ParameterPlotter sample review.

Hub's Cedar Raw JSON links refer to the NarrativeLine-owned files on `main`.
Publishing this candidate would therefore update the JSON fetched through
Hub's existing entry, even without a Hub repository change. It does not prove
new ParameterPlotter or LiaisonScape behavior, change a cross-app contract, or
promote the Candidate. Public HTTPS/Handoff and consumers must be evaluated
within their own release decisions.

## Local verification and evidence limits

- Automated: `npm test` **370/370 PASS**, `npm run lint` **PASS**, and
  `npm run build` **PASS** on the uncommitted candidate. The order-fixed
  startup R1/R2 revision test and stale-writer / replacement tests are within
  the passing suite. `git diff --check` **PASS**. These are not Human Browser
  Acceptance.
- Codex isolated Edge/CDP, Edge `155.0.4283.45`, production build served only
  on `127.0.0.1:5599`, with disposable profiles and origin-local Workspace:
  a clean second tab saved a newer title, and the older tab's later title write
  was refused with a conflict warning. The saved JSON remained byte-identical
  to the newer revision; the older tab retained its input and an Export Blob
  containing its title and 15 Events. Capturing that Blob does not verify
  browser download completion.
- In a separate three-tab sequence, an unapplied draft in one tab blocked
  another tab's Cedar replacement. The saved JSON remained unchanged. After
  the draft was cleared, explicit Retry replaced it with Cedar. Reload showed
  Continue Editing, preserved the saved JSON byte-for-byte, and resumed a
  12-Event Cedar Timeline. An independent isolated Japanese profile opened
  Cedar JA and showed its Japanese title and 12 Timeline cards. Candidate
  Credits displayed the version and preparation date.
- The isolated Codex browser work exercised ordinary orderings, not every
  startup interleaving. The startup race's order-fixed automated test and
  earlier bounded browser/acceptance record supply separate evidence. Codex
  did not verify live HTTPS, CORS Handoff, a cross-browser matrix, or browser
  download completion.
- `npm audit --omit=dev --audit-level=high` could not obtain a response from
  the registry audit endpoint in this environment. This is **NOT VERIFIED**,
  not a security PASS. Repeat in a network-capable release environment.

## Human Browser review plan and decision — 2026-10-19

The preparation plan used a disposable browser profile and test Dataset:

1. Open the local candidate in EN, open Credits, and check version/date and
   normal Home/Timeline display. Edit a test title, return Home, Continue
   Editing, reload, and confirm the saved title and Events remain.
2. Export E2R JSON and check the completed file opens and contains the test
   title/Events. The app's Export action alone does not prove download completion
   or browser-workspace save.
3. Open Cedar EN and JA separately. Check the corresponding title, legible
   12-Event Timeline, and intended story/content. Where Extension diagnostics
   are visible, preserve the expected unknown-Candidate warnings.
4. Check the More button's hover and keyboard focus at normal and narrow
   widths, plus the changed backdrop behavior on a representative dismissible
   and non-dismissible dialog. Record any visual or interaction mismatch.

Human then reviewed the local production-build preview in an isolated Edge
guest environment and reported **all OK**. The formally accepted, bounded
range comprises ordinary startup and Dataset-title editing; Home → Continue
Editing; Reload, Resume, and retained Dataset content; E2R JSON Export and
download; Cedar EN/JA acquisition and display; More hover and keyboard
operation; Credits in EN/JA; dialog/backdrop behavior; and 390 CSS px display.
The browser review ran against the `0.2.1` candidate worktree based on
`e35dd60347a831df92469d55c48fb74079df2a62`, not that HEAD alone.

The Human supplied EN/JA Credits screenshots and reported that the visible
images show `NarrativeLine 0.2.1`, the EN/JA update-date labels for
`2026-10-19`, Cedar's 12 Events, and the narrow-width layout. The images were
not available for independent pixel inspection during this documentation pass;
these are Human-reported screenshot observations. The sequence of operations,
More hover, focus, and completed download are **Human operation reports**,
not facts derived from still images. When the UI changed to EN while an
already-open Japanese Cedar Dataset remained active, its title and Event
names remained Japanese;
Dataset content is not automatically translated. That image is not evidence
of the English Cedar Dataset's content. Cedar EN acquisition and display are
within the Human operation report, with no separate EN-content image claim.

The Human-submitted `RC 0.2.1 Human Test.e2r.json` was also inspected as a
JSON file: `extensions.metadata.title` is `RC 0.2.1 Human Test` and it has
15 Events (SHA-256 `24789bf76c310ea631d4c933cac6a9887f695acdd0729156d7439afe9390647a`).
This file inspection corroborates its content; it does not independently log
the browser operation sequence. Codex Edge/CDP observations above and the
370-test automated result remain separate from this Human Browser evidence.

Human formally accepted this integrated release-candidate review as
**HUMAN ACCEPTED / CLOSED (BOUNDED)** on 2026-10-19. Existing bounded Human
acceptance for the startup-race repair and other prior work retains its own
scope. This decision does not accept all concurrency orderings, every browser
or failure mode, public HTTPS behavior, or post-deployment live behavior.

## Remaining release decisions

The bounded local RC Browser Acceptance permits a local Git checkpoint. Human
must separately decide the exact public release revision and authorize any
public write. Before that decision, confirm final tests/build and repeat a
network-capable advisory check on the exact candidate revision. A `main` push
may trigger GitHub Pages; deployment and live behavior require separate
verification. This acceptance does not authorize push, tag, GitHub Release,
deployment, or publication.
