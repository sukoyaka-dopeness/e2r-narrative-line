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
