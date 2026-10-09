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
