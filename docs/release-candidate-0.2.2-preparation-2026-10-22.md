# NarrativeLine 0.2.2 local release candidate preparation

Status at the 2026-10-23 metadata-finalization checkpoint:
**LOCAL COMMITS PREPARED / PUBLICATION PENDING**. This document records the
local candidate, not a deployed `0.2.2` release or production verification. At this checkpoint,
the published application remains `0.2.1` at
`54bc709b695b98de382c75e90459fd53cd85caff`.

## Included work and acceptance

The previously unpushed documentation commit
`4dd250b15e99c3a8e852abc2884872915704f834` records the `0.2.1`
publication verification and remains unchanged. The new work is separated into:

| Local commit | Change | Acceptance evidence |
| --- | --- | --- |
| `ba057ebffc4ef19f5dbf3dda4da5563583528c75` | History 2 supported single-position same-day time comparison and regression tests | [Berlin Wall EN/JA bounded local Human PASS](history-2-same-day-timeline-order-human-acceptance-2026-10-22.md) |
| `80a04a6b872802964099b3a6899b9b5142f3c484` | Event Detail FIX2 footer clearance | [bounded local Human re-acceptance PASS](event-detail-fixed-footer-occlusion-human-acceptance-2026-10-22.md) |
| `03b8c75ec349acef4b9497b755faeb12defe034d` | Ko-fi Home link and EN/JA regression coverage | [bounded local Human PASS](kofi-home-link-human-acceptance-2026-10-22.md) |

The three local Human reviews are distinct from automated checks and Codex
Browser evidence. Their exact reviewed cases and exclusions remain in the
linked records. These commits do not change Dataset, Core, Extension, Schema,
the existing handoff contract, or the published `0.2.1` revision.

## Version and publication date gate

The local candidate uses `0.2.2` in the package, lockfile, and EN/JA Credits
Application display. Credits `First release` remains `2026-08-06`. At the
initial 2026-10-22 preparation checkpoint, Credits `Updated` still showed
`2026-10-19`, the previous release date. Human subsequently selected
2026-10-23 (JST) as the planned deployment date; EN/JA Credits and their tests
now use `Updated: 2026-10-23`. This is planned-release metadata, not evidence
of a successful deployment. Before any push, Human must approve the final
commit SHA and complete range. If deployment is expected to occur on a later
JST date, stop for a new Human date decision and corresponding final SHA.

The existing `main` push workflow runs tests, lint, build, and automatic Pages
deployment. No push, workflow execution, deployment, tag, or release is part of
this local preparation. Public HTTPS verification and formal publication
closure are later, separate gates.

## Local integrated verification

At the initial 2026-10-22 checkpoint, after the three change commits and the
`0.2.2` version edits, Codex ran the combined candidate through `npm test`
(**375/375 PASS**), `npm run lint` (PASS), and `npm run build` (PASS). The
EN/JA Credits test then checked the `0.2.2` Application label, retained
`2026-08-06` First release, and still-current `2026-10-19` Updated. This is
historical local automated evidence. The 2026-10-23 metadata-finalization
checks are reported separately from it. The earlier bounded Human Browser
reviews remain separate, and the public `0.2.2` build has not been verified.

After the approved 2026-10-23 Updated change, Codex reran the integrated
candidate: `npm test` **375/375 PASS**, `npm run lint` PASS, and `npm run build`
PASS. A source/build check found `0.2.2` in package, lockfile, EN/JA Credits
expectations, and generated JS; the generated JS includes `2026-10-23`.
Credits First release remains `2026-08-06`. This is local automated evidence,
not Human Browser re-acceptance or public deployment verification.
