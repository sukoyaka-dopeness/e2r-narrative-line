import assert from "node:assert/strict";
import test from "node:test";
import {
  hasLossRisk,
  hasPendingUserWork,
  registerBeforeUnloadProtection,
} from "../src/services/PendingWorkService.ts";

test("pending sources remain independent", () => {
  assert.equal(hasPendingUserWork({ event: false, coordinate: false }), false);
  assert.equal(hasPendingUserWork({ event: true, coordinate: false }), true);
  assert.equal(hasPendingUserWork({ event: false, coordinate: true }), true);
  assert.equal(hasPendingUserWork({ event: true, coordinate: true }), true);
});

test("loss risk is the union of Dataset modification and pending work", () => {
  assert.equal(hasLossRisk(false, false), false);
  assert.equal(hasLossRisk(false, true), true);
  assert.equal(hasLossRisk(true, false), true);
  assert.equal(hasLossRisk(true, true), true);
});

test("beforeunload protection is registered only for loss risk", () => {
  const listeners = new Set();
  const target = {
    addEventListener(type, listener) {
      assert.equal(type, "beforeunload");
      listeners.add(listener);
    },
    removeEventListener(type, listener) {
      assert.equal(type, "beforeunload");
      listeners.delete(listener);
    },
  };

  const cleanCleanup = registerBeforeUnloadProtection(target, false);
  cleanCleanup();
  assert.equal(listeners.size, 0);

  const cleanup = registerBeforeUnloadProtection(target, true);
  assert.equal(listeners.size, 1);
  const event = {
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
    returnValue: undefined,
  };
  [...listeners][0](event);
  assert.equal(event.prevented, true);
  assert.equal(event.returnValue, "");

  cleanup();
  assert.equal(listeners.size, 0);
});
