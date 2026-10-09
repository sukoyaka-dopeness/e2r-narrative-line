# Cross-Tab Workspace Safety — 2026-10-10

## Scope

NarrativeLine stores its most recently accepted Dataset in the origin-wide `narrativeline.lastDataset` localStorage key. This checkpoint protects that shared workspace across tabs while retaining the current acquisition, replacement confirmation, export, and before-unload contracts.

## Behavior

- Each live tab publishes whether its Dataset differs from its accepted baseline or it has pending form work. A live Web Lock distinguishes an active tab from a stale localStorage marker left after an abnormal exit.
- Replacement acceptance, including clean-tab Startup Handoff, is serialized by an app-specific Web Lock. It is refused while another live tab reports pending work, and the candidate remains available for retry or cancellation.
- Autosave compares the exact `narrativeline.lastDataset` string against the revision this tab loaded or last wrote. A stale tab cannot overwrite a newer revision. Its visible Dataset remains in memory and the app reports the conflict.
- Coordination or storage verification failures stop replacement and browser-local writes. Dataset export remains the user-controlled recovery path.
- On `pagehide`, the tab marker is removed and its Web Lock is released, including during BFCache suspension. A restored page acquires a fresh lock on `pageshow`. Stale markers are ignored and cleaned, avoiding a permanent lock after tab closure or crash.

## Verification

The service tests cover live/stale registration, blocking replacement while a peer has pending work, retry after that work clears, rejecting a stale serialized revision, and failing closed when Web Locks are unavailable. On 2026-10-10, `npm.cmd run build` passed and the full suite passed (354/354 tests).

Codex used an isolated Edge profile and the temporary same-origin server described in the E2R-SPEC checkpoint. With an open Event draft in tab A, tab B's Ashen Crown Startup Handoff did not alter `narrativeline.lastDataset`; the user-facing warning identified the other tab's unapplied work. Cancelling the draft cleared A's active-work status. A clean retry from a separate tab was not confirmed in this browser run. This is Codex browser evidence, not Human Browser Acceptance; review remains pending for retry, stale-tab write attempts, additional failure paths, and public-hosted behavior.

## Follow-up: single-tab replacement failure and recovery

The prior browser note is retained as the result of that earlier run. A later Human Browser Review found that a single NarrativeLine tab could not replace its Dataset after choosing **Discard and Continue**. The warning said the tab could not register its workspace safely. The Human had one NarrativeLine tab; the other E2R apps were on different localhost ports, so they were separate browser origins and were not peer tabs in NarrativeLine's origin-scoped workspace.

Codex reproduced the registration warning in an isolated Edge profile on the local NarrativeLine development server before the fix. The source cause was lifecycle handling: `App` created the workspace coordinator during render, while the application is mounted under React `StrictMode`. StrictMode's development setup/cleanup replay disposed the render-created coordinator and left the mounted app with that disposed instance. Its later replacement transaction therefore failed closed with “This tab could not register its workspace safely.” The browser evidence supports this cause; it does not implicate InPrivate itself or other E2R apps.

The coordinator is now created and disposed with the owning effect. It also invalidates asynchronous registration callbacks after disposal, and suspends/re-registers cleanly across BFCache lifecycle events. While a Handoff candidate is pending, autosave no longer writes the outgoing Dataset. A clean candidate blocked by a peer or an unverifiable workspace now gets a truthful safety message and explicit retry/cancel actions instead of the local-unsaved-work replacement dialog. If another tab has advanced the saved Dataset revision, the stale Handoff candidate offers a reload-and-refetch action; it is not force-rebased over the newer revision.

Codex's isolated Edge run on 2026-10-10 confirmed:

- A clean single-tab Startup Handoff accepted its Dataset without a registration alert (also covered by the StrictMode integration test).
- With an unsaved Event form in tab A, tab B's Handoff was blocked and the saved Berlin Dataset remained unchanged. After cancelling the form, the candidate's original expected revision was stale because entering and cancelling a new Event draft had advanced the stored serialization. The app refused the stale candidate and offered reload-and-refetch. Using that action accepted Cedar, with 12 Events and 6 Entities, and removed the warning.
- The older Berlin tab then attempted a title write. It reported that another tab had saved a newer Dataset, and the shared saved state remained Cedar; the stale tab did not overwrite it.

The cross-tab browser run used two NarrativeLine pages sharing one disposable local origin and test storage. It did not exercise GitHub Pages' same-origin multi-app deployment, public HTTPS/CORS, every acquisition failure, or all Reload/Back/Forward/BFCache and abnormal-exit paths. The earlier test verified ordinary dirty-dataset Cancel/Discard behavior, but a full matrix of those paths remains for Human review. Computer Use initialization remained unavailable; these are Codex-operated CDP browser checks, not Human Browser Acceptance.

Automated verification for this follow-up: `npm.cmd run build` passed; `npm.cmd run lint` passed; the targeted Cross-Tab service and StrictMode integration tests passed (8/8). The full suite reported 358/359, with the file-level `entityDeletionFinalIntegration.test.js` worker failing; that test passed when run by itself. A serial full-suite attempt did not finish within the available run window. This unrelated test-suite instability remains unresolved and is not counted as a pass.

Public release remains NO-GO. Human Browser Acceptance is pending for the single-tab replacement and recovery behavior, same-origin multi-app deployment, and the remaining failure/lifecycle paths.

## Follow-up: Dataset title draft protection and conflict layout

Human Browser Review then found two further failures in Edge InPrivate with two NarrativeLine tabs. Tab A's Dataset title input was changed but not applied. Tab B accepted a Sample Dataset without a peer-work warning. When A later applied its title, the stale-write guard correctly refused the write, but its warning appeared beside the Timeline in a severely narrowed layout.

Source inspection identified two independent causes:

- `TimelineScreen` kept the title input in local `titleDraft` state but did not report that draft through the app's pending-work registry. Since the accepted Dataset itself was still unchanged, tab A's shared marker remained inactive and tab B did not see the open title work.
- `.app-content` is a row flex container. `AppFrame` places its child screen and the cross-tab feedback as siblings; each is styled to `width: 100%`. When a stale-write alert was added beside the Timeline, the flex row shrank both siblings, producing the narrow columns seen by Human.

The title editor now marks a dedicated pending-work source whenever its current text differs from the Dataset title. The state is published immediately through the same ref-backed tab marker used by Event and Entity forms. Reverting the text to the stored title or applying the title clears that pending source; typing alone does not write or modify the saved Dataset. The editor also resets its draft when the Dataset title changes. `.app-content` now stacks screen and feedback vertically, so a safety alert cannot compress the Timeline.

Codex used an isolated Edge profile with two NarrativeLine tabs on one disposable localhost origin. With an unapplied Japanese title in tab A, the tab marker became active while `narrativeline.lastDataset` remained byte-for-byte unchanged. Tab B's Cedar sample replacement was refused and explained the peer work. Reverting A's title cleared the pending marker; retrying in B accepted Cedar. A's subsequent title apply was rejected as a stale write, and the saved Dataset remained Cedar.

With the stale-write alert visible, measured widths at an 800px browser viewport were: root 741px, content and Timeline 739px, alert 739px. At a 390px viewport, content, Timeline, and alert were each 388px; the title input was 242px, toolbar 356px, and document scroll width 390px. No horizontal overflow or collapsed text column was observed in this Codex browser run.

Regression coverage now verifies that an unapplied title marks the tab active without changing the saved Dataset, clearing the draft deactivates the marker, and AppFrame stacks screen/feedback. Existing Event/Entity pending-work coverage remains in the suite. The focused pending-work, service, navigation-guard, and layout tests passed (33/33); build and lint passed. Full-suite results and any unrelated known failure are recorded in the checkpoint report. This remains Codex evidence, not Human Browser Acceptance. Human should repeat the two-tab title-draft block, safe retry, stale-write protection, and layout checks in the supported Edge InPrivate environment. Same-origin GitHub Pages multi-app behavior and other browsers remain unverified. Public release remains NO-GO.

The adopted E2R-SPEC safety design and the existing `ai-knowledge/decisions/cross-context-workspace-safety.md` and `ai-knowledge/playbooks/workspace-safety-review-and-acceptance.md` were applied as-is. This is an implementation correction within the accepted contract; no new safety decision was added.

The full repository suite was rerun after these changes and passed 360/360. The earlier 358/359 file-level failure in `entityDeletionFinalIntegration.test.js` did not recur; the prior isolated rerun of that file had also passed. There is no known current full-suite failure from this checkpoint.
