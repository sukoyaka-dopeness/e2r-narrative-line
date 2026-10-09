const STORAGE_KEY = "narrativeline.lastDataset";
const TAB_PREFIX = "e2r:narrativeline:workspace-tab:";
const WRITE_LOCK = "e2r:narrativeline:workspace-write";

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
  target: Pick<Window, "addEventListener">,
  tabId = crypto.randomUUID(),
) {
  const statusKey = `${TAB_PREFIX}${tabId}`;
  let active = false;
  let expectedRaw: string | null;
  let coordinationError = "";
  let releaseTabLock: (() => void) | undefined;
  let tabLockHeld = false;
  try { expectedRaw = storage.getItem(STORAGE_KEY); }
  catch { expectedRaw = null; coordinationError = "Browser workspace state could not be read safely."; }
  let resolveReady!: (ready: boolean) => void;
  let ready: Promise<boolean>;

  const publish = () => {
    try { storage.setItem(statusKey, JSON.stringify({ tabId, active })); }
    catch { coordinationError = "Browser workspace status could not be shared safely."; }
  };
  const setActive = (value: boolean) => { active = value; publish(); };

  const acquireTabLock = () => {
    if (!lockManager) {
      coordinationError = "This browser cannot safely coordinate workspace changes across tabs.";
      ready = Promise.resolve(false);
      return;
    }
    ready = new Promise<boolean>((resolve) => { resolveReady = resolve; });
    const hold = new Promise<void>((resolve) => { releaseTabLock = resolve; });
    void lockManager.request(`${TAB_PREFIX}${tabId}`, async (lock) => {
      if (!lock) { resolveReady(false); return; }
      tabLockHeld = true;
      publish();
      resolveReady(true);
      await hold;
      tabLockHeld = false;
    }).catch((error: unknown) => {
      coordinationError = error instanceof Error ? error.message : "Browser tab coordination failed.";
      resolveReady(false);
    });
  };
  acquireTabLock();

  async function transact(serialized: string, replacement: boolean): Promise<WorkspaceWriteResult> {
    if (!lockManager || coordinationError) return { ok: false, reason: coordinationError || "Cross-tab safety could not be verified." };
    if (!(await ready) || !tabLockHeld) return { ok: false, reason: "This tab could not register its workspace safely." };
    try {
      return await lockManager.request(WRITE_LOCK, { mode: "exclusive" }, async (lock) => {
        if (!lock) return { ok: false as const, reason: "Another tab is changing this Dataset. Retry after it finishes." };
        const heldSnapshot = await lockManager.query();
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

  const dispose = () => {
    try { storage.removeItem(statusKey); } catch { /* page is exiting */ }
    releaseTabLock?.();
    tabLockHeld = false;
  };
  target.addEventListener("pagehide", dispose as EventListener);
  target.addEventListener("pageshow", ((event: PageTransitionEvent) => {
    if (event.persisted) {
      coordinationError = "";
      acquireTabLock();
    }
  }) as EventListener);

  return {
    setActive,
    save: (serialized: string) => transact(serialized, false),
    replace: (serialized: string) => transact(serialized, true),
    dispose,
  };
}

export function crossTabWriteFailure(locale: "en" | "ja", reason: string): string {
  if (locale === "ja") return "別のNarrativeLineタブに未適用の作業があるか、保存状態を安全に確認できません。現在のDatasetは置き換えていません。別のタブで作業を保存または取り消してから再試行してください。";
  return `Another NarrativeLine tab has unapplied work, or its saved state could not be checked safely. The current Dataset was not replaced. ${reason}`;
}
