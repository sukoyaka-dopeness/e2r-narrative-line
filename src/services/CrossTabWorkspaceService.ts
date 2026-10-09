const STORAGE_KEY = "narrativeline.lastDataset";
const TAB_PREFIX = "e2r:narrativeline:workspace-tab:";
const WRITE_LOCK = "e2r:narrativeline:workspace-write";

export type PeerWorkspaceStatus =
  | { kind: "clear" }
  | { kind: "work"; count: number }
  | { kind: "unknown" };

export function inspectNarrativeLinePeerWork(
  storage: Storage,
  heldLockNames: Set<string>,
  ownTabId: string,
): PeerWorkspaceStatus {
  try {
    const peerLocks = [...heldLockNames].filter((name) =>
      name.startsWith(TAB_PREFIX) && name !== `${TAB_PREFIX}${ownTabId}`,
    );
    let count = 0;
    for (const lockName of peerLocks) {
      let record: { tabId?: string; active?: boolean } | null;
      try { record = JSON.parse(storage.getItem(lockName) ?? "null"); }
      catch { return { kind: "unknown" }; }
      if (!record || record.tabId !== lockName.slice(TAB_PREFIX.length) || typeof record.active !== "boolean") {
        return { kind: "unknown" };
      }
      if (record.active) count += 1;
    }
    return count ? { kind: "work", count } : { kind: "clear" };
  } catch {
    return { kind: "unknown" };
  }
}

export type WorkspaceWriteResult =
  | { ok: true; raw: string }
  | { ok: false; reason: string; conflict?: boolean; blockedByPeer?: boolean };

export function activeNarrativeLineTabs(
  storage: Storage,
  heldLockNames: Set<string>,
  ownTabId: string,
): { active: string[]; staleKeys: string[] } {
  const active: string[] = [];
  const staleKeys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(TAB_PREFIX)) continue;
    let record: { tabId?: string; active?: boolean } | null = null;
    try { record = JSON.parse(storage.getItem(key) ?? "null"); } catch { /* stale record */ }
    if (!record?.active || !record.tabId || record.tabId === ownTabId) continue;
    if (heldLockNames.has(`${TAB_PREFIX}${record.tabId}`)) active.push(record.tabId);
    else staleKeys.push(key);
  }
  return { active, staleKeys };
}

export function createCrossTabWorkspaceService(
  storage: Storage,
  lockManager: LockManager | undefined,
  target: Pick<Window, "addEventListener" | "removeEventListener">,
  tabId = crypto.randomUUID(),
) {
  const statusKey = `${TAB_PREFIX}${tabId}`;
  let active = false;
  let expectedRaw: string | null;
  let coordinationError = "";
  let releaseTabLock: (() => void) | undefined;
  let tabLockHeld = false;
  let disposed = false;
  let generation = 0;
  let resolveReady: ((ready: boolean) => void) | undefined;
  let ready: Promise<boolean> = Promise.resolve(false);
  const listeners = new Set<() => void>();
  try { expectedRaw = storage.getItem(STORAGE_KEY); }
  catch { expectedRaw = null; coordinationError = "Browser workspace state could not be read safely."; }

  const publish = () => {
    if (disposed) return;
    try { storage.setItem(statusKey, JSON.stringify({ tabId, active })); }
    catch { coordinationError = "Browser workspace status could not be shared safely."; }
  };
  const setActive = (value: boolean) => { active = value; publish(); };

  const acquireTabLock = () => {
    disposed = false;
    const requestGeneration = ++generation;
    if (!lockManager) {
      coordinationError = "This browser cannot safely coordinate workspace changes across tabs.";
      ready = Promise.resolve(false);
      return;
    }
    let resolveCurrentReady!: (acquired: boolean) => void;
    ready = new Promise<boolean>((resolve) => { resolveCurrentReady = resolve; });
    resolveReady = resolveCurrentReady;
    const hold = new Promise<void>((resolve) => { releaseTabLock = resolve; });
    void lockManager.request(`${TAB_PREFIX}${tabId}`, async (lock) => {
      if (!lock || disposed || requestGeneration !== generation) {
        resolveCurrentReady(false);
        return;
      }
      tabLockHeld = true;
      publish();
      resolveCurrentReady(true);
      await hold;
      if (requestGeneration === generation) tabLockHeld = false;
    }).catch((error: unknown) => {
      if (disposed || requestGeneration !== generation) return;
      coordinationError = error instanceof Error ? error.message : "Browser tab coordination failed.";
      resolveCurrentReady(false);
    });
  };
  acquireTabLock();

  async function transact(serialized: string, replacement: boolean): Promise<WorkspaceWriteResult> {
    const requestGeneration = generation;
    const isCurrent = () => !disposed && requestGeneration === generation;
    if (!lockManager || coordinationError) return { ok: false, reason: coordinationError || "Cross-tab safety could not be verified." };
    if (!isCurrent() || !(await ready) || !isCurrent() || !tabLockHeld) {
      return { ok: false, reason: "This tab could not register its workspace safely." };
    }
    try {
      return await lockManager.request(WRITE_LOCK, { mode: "exclusive" }, async (lock) => {
        if (!isCurrent()) return { ok: false as const, reason: "This tab could not register its workspace safely." };
        if (!lock) return { ok: false as const, reason: "Another tab is changing this Dataset. Retry after it finishes." };
        const heldSnapshot = await lockManager.query();
        if (!isCurrent()) return { ok: false as const, reason: "This tab could not register its workspace safely." };
        const held = new Set((heldSnapshot.held ?? []).map((item) => item.name).filter((name): name is string => Boolean(name)));
        const tabs = activeNarrativeLineTabs(storage, held, tabId);
        for (const key of tabs.staleKeys) {
          try { storage.removeItem(key); } catch { /* cleanup is best effort */ }
        }
        if (tabs.active.length) return {
          ok: false as const,
          blockedByPeer: true,
          reason: "Another NarrativeLine tab has unapplied Dataset changes or an open edit. Finish or cancel that work before replacing or saving this shared workspace.",
        };
        let current: string | null;
        try { current = storage.getItem(STORAGE_KEY); }
        catch { return { ok: false as const, reason: "The saved Dataset could not be checked safely. No replacement was made." }; }
        if (current !== expectedRaw) return {
          ok: false as const,
          conflict: true,
          reason: "Another NarrativeLine tab changed the saved Dataset. This older tab did not overwrite it. Export any work you need, then reload before continuing.",
        };
        try { storage.setItem(STORAGE_KEY, serialized); }
        catch { return { ok: false as const, reason: "The Dataset could not be saved to browser storage. The current screen was kept." }; }
        expectedRaw = serialized;
        if (replacement) setActive(false);
        return { ok: true as const, raw: serialized };
      });
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Cross-tab safety could not be verified." };
    }
  }

  const suspend = () => {
    if (disposed) return;
    disposed = true;
    generation += 1;
    resolveReady?.(false);
    try { storage.removeItem(statusKey); } catch { /* page is exiting */ }
    releaseTabLock?.();
    releaseTabLock = undefined;
    tabLockHeld = false;
  };
  const resume = (event: PageTransitionEvent) => {
    if (event.persisted) {
      coordinationError = "";
      acquireTabLock();
    }
  };
  const handlePageHide = () => suspend();
  const handlePageShow = (event: Event) => resume(event as PageTransitionEvent);
  const handleStorage = (event: Event) => {
    const key = (event as StorageEvent).key;
    if (key !== null && !key?.startsWith(TAB_PREFIX)) return;
    for (const listener of listeners) listener();
  };
  target.addEventListener("pagehide", handlePageHide);
  target.addEventListener("pageshow", handlePageShow);
  target.addEventListener("storage", handleStorage);
  const dispose = () => {
    target.removeEventListener("pagehide", handlePageHide);
    target.removeEventListener("pageshow", handlePageShow);
    target.removeEventListener("storage", handleStorage);
    listeners.clear();
    suspend();
  };

  return {
    setActive,
    async peerWorkStatus(): Promise<PeerWorkspaceStatus> {
      if (!lockManager || coordinationError) return { kind: "unknown" };
      try {
        const registered = await ready;
        if (!registered || disposed || !tabLockHeld || coordinationError) return { kind: "unknown" };
        const snapshot = await lockManager.query();
        if (coordinationError) return { kind: "unknown" };
        const held = new Set((snapshot.held ?? []).map((item) => item.name).filter((name): name is string => Boolean(name)));
        return inspectNarrativeLinePeerWork(storage, held, tabId);
      } catch {
        return { kind: "unknown" };
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    save: (serialized: string) => transact(serialized, false),
    replace: (serialized: string) => transact(serialized, true),
    dispose,
  };
}

export function crossTabWriteFailure(locale: "en" | "ja", reason: string): string {
  if (reason.startsWith("Another NarrativeLine tab has unapplied Dataset changes")) {
    return locale === "ja"
      ? "別のNarrativeLineタブに未保存の変更または開いたままの編集があります。現在のDatasetは置き換えていません。別タブの作業を保存または取り消してから、この候補を再試行してください。"
      : "Another NarrativeLine tab has unapplied Dataset changes or an open edit. The current Dataset was not replaced. Save or cancel that work in the other tab, then retry this candidate.";
  }
  if (reason.startsWith("Another NarrativeLine tab changed the saved Dataset")) {
    return locale === "ja"
      ? "別のNarrativeLineタブが新しいDatasetを保存しました。この古いタブからの書き戻しは行っていません。必要な作業を書き出し、最新状態を読み直してから続けてください。"
      : `Another NarrativeLine tab changed the saved Dataset. This older tab did not overwrite it. Export any work you need, then reload before continuing. Details: ${reason}`;
  }
  if (reason === "This tab could not register its workspace safely.") {
    return locale === "ja"
      ? "このタブのWorkspace登録を安全に確認できませんでした。Datasetは置き換えていません。ブラウザーの協調処理が利用できる状態で再試行するか、この候補を取り消してください。"
      : "This tab could not register its workspace safely. No Dataset was replaced. Retry when browser coordination is available, or cancel this candidate.";
  }
  if (reason.startsWith("Another tab is changing this Dataset")) {
    return locale === "ja"
      ? "別のタブがDatasetを変更中です。Datasetは置き換えていません。処理の終了後にこの候補を再試行するか、取り消してください。"
      : `Another tab is changing this Dataset. No Dataset was replaced. Retry this candidate when it finishes, or cancel it. Details: ${reason}`;
  }
  return locale === "ja"
    ? `Workspaceの安全性を確認できなかったため、Datasetは置き換えていません。原因が解消した後に再試行するか、この候補を取り消してください。詳細: ${reason}`
    : `Workspace safety could not be verified. No Dataset was replaced. Retry after access is restored, or cancel this candidate. Details: ${reason}`;
}
