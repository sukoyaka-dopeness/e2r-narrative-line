# NarrativeLine Current-State and Release-Readiness Audit (2026-09-30)

## Decision summary

**Audit preparation is complete; a release transaction is not authorized or
ready to start.** No concrete current runtime defect or dependency mismatch was
found in the reviewed source. Human decisions remain on the application
version/release identity, whether a new showcase Dataset belongs in this
release, and the exact source revision and public-write transaction. This is
not a production deployment or live-site acceptance report.

This audit starts from NarrativeLine `055b12e32f6e9b5e4ea7b9a053f9b7d70314161f`
and E2R-SPEC `268fafd6483d2ea9b08c63d00b502d37f0459776`. NarrativeLine source
and documentation are inspected locally; Human Browser evidence below refers
to the separately recorded local acceptance, not a deployed site.

## Current product and authority

The current application includes the accepted MVP editing flow; History 2
`position-circa` bounded editing; qualitative Relative Time and bounded
Quantitative Relative Time (`calendar-granule-relation` and `elapsed-offset`);
Timeline Relative Time progressive disclosure and diagnostics; Perspective
0.1.0 ordering with explicit session-only editing, keyboard moves, and
supplementary card-wide drag; and read/edit boundaries documented in the user
guides. The QRT implementation and Human Browser Acceptance record is
[`quantitative-relative-time-user-facing-milestone-implementation.md`](quantitative-relative-time-user-facing-milestone-implementation.md).
Its final Human visual review explicitly passed the multi-candidate Timeline
spacing and the preceding Event Detail control/group spacing refinement.

Application support does not promote Candidate specifications or broaden
their contracts. Relative Time 0.2.0 and Perspective 0.1.0 remain Candidate;
History 2.0.0 remains Candidate outside the bounded `position-circa` Stable
profile. Validator 0.7.0 recognition boundaries remain separate. In
particular, imported Perspective recognition diagnostics are not suppressed
by NarrativeLine and are tracked separately from the accepted consumer UI.
Coordinate remains limited to the documented experimental read/edit surface.

The accepted Relative Time, History, Perspective ordering, progressive
disclosure, and QRT semantics remain closed. Their acceptance records and
implementation records are evidence; this audit does not reopen them.

## Readiness classification

### Release blockers

- **No verified current runtime or dependency blocker was found** in this
  repository audit. Installed dependencies match the lockfile; the app pins
  `@sukoyaka-dopeness/e2r-validator` exactly at `0.7.0`, and the referenced
  deployment workflow checks out its declared E2R-SPEC revision.
- The advisory endpoint could not be reached by `npm audit --omit=dev`; no
  vulnerability conclusion can be drawn from that failed request. Re-run an
  advisory scan in a network-capable pre-release environment.
- A release transaction is not ready to start until the Human decisions below
  are recorded and the resulting exact release revision is prepared. This is a
  governance gate, not a discovered source defect.

### Human decisions required

1. **Release version and identity.** `package.json` and `package-lock.json`
   currently say `0.2.0`; the Credits UI says `NarrativeLine 0.2.0` and
   `Released: 2026-08-06`. E2R-SPEC Roadmap still says to keep NarrativeLine at
   `0.1.0` until an explicit release/version decision. Thus `0.2.0` is the
   configured local version and a plausible candidate, but it is not an
   approved release version. The Credits date predates the completed QRT
   acceptance and must be reconciled with the actual release decision/date
   before publication; do not treat it as proof that 0.2.0 was released.
2. **Showcase sample scope.** Decide whether a new QRT/Perspective showcase is
   required for this release or should be a separate post-release checkpoint.
   No sample is created, replaced, or promoted by this audit.
3. **Release transaction.** After the above, approve the exact commit/revision,
   public-write mechanism, and timing. The checked-in Pages workflow deploys
   automatically on a push to `main` (and can be manually dispatched), so a
   future push to that branch is a public deployment action. No tag, npm
   package publication, or GitHub Release workflow was found. The package is
   marked `private: true`; do not infer npm publication from its package
   metadata.

### Non-blocking follow-ups

- Broader History 2 authoring, Relative Time inference beyond direct one-hop,
  time-zone/DST evaluation, and provenance/Citation are deferred or out of
  scope. Current UI explicitly presents unassessed time-zone/DST results as
  candidates.
- Validator Perspective Candidate support and other-consumer support are
  separate workstreams; their absence is not an application release defect
  established by this audit.
- Cross-App visual-style work remains separate. NarrativeLine presentation
  evidence does not define LiaisonScape or E2R-wide policy.
- Run the normal CI/deployment build checks against the eventual exact release
  revision and perform live deployment acceptance only after authorization.

### Already closed / no action

- QRT is **Human Browser Acceptance PASS / ACCEPTED / CLOSED**, including
  direct one-hop candidate behavior, recorded/candidate separation, save and
  cancel boundaries, preservation, no-winner behavior, JA/EN responsive
  presentation, identity disambiguation, and final Timeline/Event Detail visual
  checks.
- Relative Time progressive disclosure and Perspective ordering/DnD are
  already accepted and closed. No semantic or runtime changes are proposed.
- Historical MVP exclusions remain accurate as historical MVP scope; they are
  not a statement that the capabilities are absent from the current app.
  This audit synchronizes current-facing documentation without rewriting
  historical acceptance records.

## Sample responsibilities and options

The Home sample is the NarrativeLine-owned Berlin Wall Dataset used for
onboarding. It is distinct from the E2R-SPEC canonical cross-application public
sample collection and its provenance records. A new NarrativeLine showcase
could be (a) added as an explicitly application-owned optional sample, (b)
replace the onboarding sample only after a separate migration/UX decision, or
(c) be deferred to a post-release sample checkpoint. The acceptance fixture at
`tests/fixtures/quantitative-relative-time-human-acceptance.e2r.json` is
purpose-built for verification (long and duplicate names, multiple Relations
and Candidates), not a polished public Dataset; keep it test-only.

The bounded recommendation for planning is to **defer a new showcase to a
separate checkpoint**, while leaving the release inclusion decision to the
Human. If a sample is selected, review its factual/fictional provenance,
source and translation attribution, redistribution rights, assets, and license
separately from the MIT code license. Validate import/export with the current
Validator; review NarrativeLine presentation and, if cross-app use is claimed,
LiaisonScape and Hub behavior; then update the relevant provenance/catalog
authority and tests. Do not imply cross-app canonical status for an
application-owned sample.

## Documentation synchronization and verification

This audit's bounded documentation synchronization:

- clarifies that the MVP exclusions in `docs/MVP.md` describe the original
  accepted MVP, while current post-MVP capabilities are listed separately;
- updates README and editing/UI documents so Relative Time authoring is not
  described as future work;
- adds EN/JA user-guide instructions for qualitative and quantitative Relative
  Time and removes the obsolete claim that before/after relationships are a
  future capability;
- links this audit from the E2R-SPEC Roadmap and records the unresolved release
  decisions there.

No runtime, test fixture, sample, schema, Validator, or Dataset was changed.
Exact CSS values are not promoted to design contracts; existing NarrativeLine
presentation guidance stays application-scoped. No new reusable-knowledge
entry is needed: the prior Knowledge Candidate Check found existing
reference-first UI consistency guidance sufficient.

Verification at this documentation checkpoint: NarrativeLine tests **344/344
PASS**, lint **PASS**, production build **PASS**, and `git diff --check`
**PASS**; E2R-SPEC `npm run validate` **PASS**; `npm ls --depth=0` **PASS**
with the exact Validator 0.7.0 dependency present. `npm audit --omit=dev`
could not complete because the registry audit request failed at the network
endpoint; this is an unavailable check, not evidence of a known vulnerability.
No production browser or deployed Pages verification was performed.

## Gate before any release transaction

1. Record the Human version/release-identity decision and whether a showcase is
   in scope.
2. On that basis, synchronize package/lockfile and Credits version/date only
   in a bounded release-preparation change; keep the date tied to the actual
   release event.
3. Select and review the exact release commit; run all repository gates and
   an available advisory scan on that revision.
4. Obtain explicit authorization for the exact public-write transaction.
   A push to `main` triggers the Pages deployment workflow.
5. Complete live-site acceptance after deployment. This audit does not
   authorize or perform any of these release actions.
