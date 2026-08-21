import assert from "node:assert/strict";
import test from "node:test";
import {
  hasLossRisk,
  hasPendingUserWork,
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
