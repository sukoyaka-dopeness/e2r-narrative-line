import test from "node:test";
import assert from "node:assert/strict";
import { activeNarrativeLineTabs, createCrossTabWorkspaceService } from "../src/services/CrossTabWorkspaceService.ts";

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

class FakeLockManager {
  held = new Map();
  async request(name, optionsOrCallback, maybeCallback) {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    if (this.held.has(name)) return callback(null);
    const lock = { name };
    this.held.set(name, lock);
    try {
      return await callback(lock);
    } finally {
      if (name === "e2r:narrativeline:workspace-write" || name.startsWith("e2r:narrativeline:workspace-tab:")) this.held.delete(name);
    }
  }
  async query() { return { held: [...this.held.values()] }; }
}

function fakeWindow() { return { addEventListener() {}, removeEventListener() {} }; }

class DelayedLockManager {
  request(name, optionsOrCallback, maybeCallback) {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    return Promise.resolve().then(() => callback({ name }));
  }
  async query() { return { held: [] }; }
}

test("only active work in a live NarrativeLine tab blocks a replacement", () => {
  const storage = new MemoryStorage();
  storage.setItem("e2r:narrativeline:workspace-tab:live", JSON.stringify({ tabId: "live", active: true }));
  storage.setItem("e2r:narrativeline:workspace-tab:closed", JSON.stringify({ tabId: "closed", active: true }));
  const result = activeNarrativeLineTabs(storage, new Set(["e2r:narrativeline:workspace-tab:live"]), "self");
  assert.deepEqual(result.active, ["live"]);
  assert.deepEqual(result.staleKeys, ["e2r:narrativeline:workspace-tab:closed"]);
});

test("replacement is blocked by another tab's pending work and succeeds after it clears", async () => {
  const storage = new MemoryStorage();
  const locks = new FakeLockManager();
  const first = createCrossTabWorkspaceService(storage, locks, fakeWindow(), "first");
  const second = createCrossTabWorkspaceService(storage, locks, fakeWindow(), "second");
  await Promise.resolve();
  first.setActive(true);
  const blocked = await second.replace('{"id":"incoming"}');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.blockedByPeer, true);
  assert.equal(storage.getItem("narrativeline.lastDataset"), null);
  first.setActive(false);
  const accepted = await second.replace('{"id":"incoming"}');
  assert.equal(accepted.ok, true);
  assert.equal(storage.getItem("narrativeline.lastDataset"), '{"id":"incoming"}');
  first.dispose();
  second.dispose();
});

test("an older tab cannot overwrite the serialized Dataset revision", async () => {
  const storage = new MemoryStorage();
  const locks = new FakeLockManager();
  const first = createCrossTabWorkspaceService(storage, locks, fakeWindow(), "first");
  const second = createCrossTabWorkspaceService(storage, locks, fakeWindow(), "second");
  await Promise.resolve();
  assert.equal((await first.save('{"revision":1}')).ok, true);
  second.setActive(false);
  const staleWrite = await second.save('{"revision":0}');
  assert.equal(staleWrite.ok, false);
  assert.equal(staleWrite.conflict, true);
  assert.equal(storage.getItem("narrativeline.lastDataset"), '{"revision":1}');
  first.dispose();
  second.dispose();
});

test("missing Web Locks fails closed without changing the saved Dataset", async () => {
  const storage = new MemoryStorage();
  storage.setItem("narrativeline.lastDataset", '{"revision":"current"}');
  const service = createCrossTabWorkspaceService(storage, undefined, fakeWindow(), "unsupported");
  const write = await service.save('{"revision":"stale"}');
  const replacement = await service.replace('{"revision":"incoming"}');
  assert.equal(write.ok, false);
  assert.equal(replacement.ok, false);
  assert.equal(storage.getItem("narrativeline.lastDataset"), '{"revision":"current"}');
  service.dispose();
});

test("disposing before asynchronous tab registration completes does not republish a stale marker", async () => {
  const storage = new MemoryStorage();
  const service = createCrossTabWorkspaceService(storage, new DelayedLockManager(), fakeWindow(), "disposed-before-register");
  service.dispose();
  await Promise.resolve();
  assert.equal(storage.getItem("e2r:narrativeline:workspace-tab:disposed-before-register"), null);
  const result = await service.replace('{"id":"incoming"}');
  assert.equal(result.ok, false);
  assert.equal(result.reason, "This tab could not register its workspace safely.");
  assert.equal(storage.getItem("narrativeline.lastDataset"), null);
});

test("a BFCache pageshow re-registers a suspended service without retaining stale state", async () => {
  const storage = new MemoryStorage();
  const listeners = new Map();
  const target = {
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const service = createCrossTabWorkspaceService(storage, new FakeLockManager(), target, "restored");
  await Promise.resolve();
  listeners.get("pagehide")();
  const suspended = await service.replace('{"id":"should-not-write"}');
  assert.equal(suspended.ok, false);
  await new Promise((resolve) => setTimeout(resolve, 0));
  listeners.get("pageshow")({ persisted: true });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const resumed = await service.replace('{"id":"incoming"}');
  assert.equal(resumed.ok, true);
  assert.equal(storage.getItem("narrativeline.lastDataset"), '{"id":"incoming"}');
  service.dispose();
});
