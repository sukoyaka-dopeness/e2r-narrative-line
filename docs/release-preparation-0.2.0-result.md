# NarrativeLine 0.2.0 release preparation

Date: 2026-09-30
Status: Local release candidate preparation; no public-write authorization

## Selected identity and scope

Human selected `0.2.0` as the next NarrativeLine application release version.
The earlier hold at `0.1.0` pending a user-facing Relative Time milestone and
an explicit version decision is resolved by the accepted qualitative Relative
Time, Perspective ordering, QRT milestones, and this Human decision. The
existing `package.json`, lockfile, and Credits version already say `0.2.0`;
no further package version increment was made. This is the **application**
release identity, not a Core, Dataset, History, Relative Time, Perspective,
or Validator version or maturity change.

The candidate contains the current accepted editing workflow; bounded History
2 position/circa support; qualitative and quantitative Relative Time with
direct one-hop Candidates; Recorded History separation; Perspective ordering
with keyboard and supplementary card-wide drag only in explicit editing;
progressive disclosure; human-readable Event identity; and the accepted EN/JA
and responsive refinements. The previous [current-state audit](current-state-release-readiness-audit-2026-09-30.md)
records their authority and closed acceptance. Nothing here broadens the
Candidate specifications or changes Dataset semantics.

The Credits modal continues to show `NarrativeLine 0.2.0`. Its old
`Released: 2026-08-06` line was removed because that was the MVP release date,
not the unpublished 0.2.0 event. The **actual 0.2.0 publication/deploy date**
must be inserted in the existing Credits date row during the authorized
release transaction, followed by exact-revision verification. No date is
invented at the local candidate stage.

## Showcase and ownership

The [Cedar Observatory candidate](cedar-observatory-showcase-release-candidate.md)
is a new fictional, NarrativeLine-owned EN/JA Dataset pair. Home offers it as a
second supplemental action and preserves the Berlin Wall onboarding action.
It is not the QRT test fixture, a change to canonical E2R-SPEC sample content,
or a Hub Gallery entry. Human selected the existing E2R sample-data policy for
eligible project-created Cedar content; the scoped
[sample notice](../src/sample/README.md) separates its CC0 1.0 bucket from the
MIT software license. Human story, EN/JA wording, and browser acceptance remain
gates before public deployment. The E2R-SPEC provenance note does not change
Gallery authority or relicense any third-party content.
The [Human Browser Acceptance preparation](cedar-observatory-human-browser-acceptance-preparation.md)
gives the local Home, Timeline, and LiaisonScape review points without treating
automated evidence as Human acceptance.
LiaisonScape can load its Entity graph, but the older Validator 0.6.0 emits
the expected unsupported Relative Time 0.2.0 declaration warning. This
candidate makes no claim of warning-free cross-app recognition and does not
change LiaisonScape's release scope.

## Verification and remaining transaction

At this local candidate checkpoint, NarrativeLine `npm test` reports **347/347
PASS**, `npm run lint` **PASS**, and `npm run build` **PASS**. The two sample files
round-trip with no NarrativeLine Validator diagnostics; the Home integration
test opens the showcase without a new navigation path. E2R-SPEC `npm run
validate` **PASS** and NarrativeLine `npm ls --depth=0` **PASS** with Validator
0.7.0. `git diff --check` was clean before staging. The attempted `npm audit
--omit=dev` could not reach the registry audit endpoint, so it is **not** a
security PASS; repeat the advisory scan in a network-capable release
environment. Real-browser inspection through the available browser-control
surface timed out while opening Edge; local UI tests do not replace Human
browser review. Exact local commit revisions are reported at checkpoint
completion rather than assumed in this document.

The release transaction still needs:

1. Human approval of the sample's story/JA–EN content and browser review of
   its Home/Timeline presentation. The sample-data policy is selected; any
   newly identified external material or rights issue returns to Human
   stewardship. Publication may not infer visual acceptance from tests.
2. Credits date synchronized to the real publication/deploy event, with the
   final edit included in the exact revision reviewed for release.
3. Network-capable advisory result and final tests/build on that exact
   revision, with any release-blocking findings resolved.
4. Explicit Human authorization for the exact public-write transaction. The
   existing GitHub Pages workflow deploys when `main` is pushed. Tag, GitHub
   Release, package publication, and other public writes are separate actions
   and are not implied by local commits.
5. Live-site acceptance after deployment.

No push, deploy, tag, package publication, GitHub Release, or public-site write
is part of this preparation.
