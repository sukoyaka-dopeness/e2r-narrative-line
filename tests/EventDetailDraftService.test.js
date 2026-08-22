import assert from "node:assert/strict";
import test from "node:test";
import { getEventHistoryDependencyValues } from "../src/services/EventDetailDraftService.ts";

function eventWithTime(time) {
  return {
    id: "E1",
    name: "Event",
    extensions: { history: { time } },
  };
}

test("event history effect inputs are primitive values", () => {
  const first = getEventHistoryDependencyValues(eventWithTime({ year: 1969, month: 7, day: 20, hour: 20 }));
  const second = getEventHistoryDependencyValues(eventWithTime({ year: 1969, month: 7, day: 20, hour: 20 }));

  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.equal(first.year, 1969);
  assert.equal(first.month, 7);
  assert.equal(first.day, 20);
  assert.equal(first.hour, 20);
  assert.equal(first.minute, undefined);
  assert.equal(first.second, undefined);
});

test("event history effect inputs change when history values change", () => {
  const original = getEventHistoryDependencyValues(eventWithTime({ year: 1969, month: 7, day: 20 }));
  const changed = getEventHistoryDependencyValues(eventWithTime({ year: 1969, month: 7, day: 21 }));

  assert.notDeepEqual(original, changed);
  assert.equal(original.day, 20);
  assert.equal(changed.day, 21);
});
