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

function fakeWindow() { return { addEventListener() {} }; }

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
