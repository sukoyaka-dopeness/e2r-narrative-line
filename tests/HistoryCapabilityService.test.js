import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyHistoryCapability,
  classifyHistoryPayload,
} from "../src/services/HistoryCapabilityService.ts";
import { getEventHistoryDate } from "../src/services/HistoryService.ts";
import { updateEvent } from "../src/services/EventService.ts";

const specificationId = "draft.github.sukoyaka-dopeness.specification";

function datasetWithHistory(history, version = "2.0.0", features = []) {
  return {
    version: "1.0",
    entities: [],
    events: [{ id: "event-1", extensions: { history } }],
    relations: [],
    extensions: {
      [specificationId]: {
        specVersion: "0.1.0",
        uses: [{ extension: "history", version, ...(features.length > 0 ? { features } : {}) }],
      },
    },
  };
}

const candidateHistory = {
  assertions: [{
    id: "position-1",
    type: "position",
    position: { year: 1969, month: 7, day: 20 },
  }],
};

test("classifies absent and stable History as editable", () => {
  assert.deepEqual(
    classifyHistoryCapability({ version: "1.0", entities: [], events: [], relations: [] }, null),
    { capability: "none", editPolicy: "editable" },
  );
  assert.deepEqual(
    classifyHistoryPayload({ time: { year: 1969, month: 7, day: 20 } }),
    { capability: "stable", editPolicy: "editable" },
  );
});

test("classifies an exact History 2 candidate as read-only", () => {
  const dataset = datasetWithHistory(candidateHistory);
  assert.deepEqual(
    classifyHistoryCapability(dataset, dataset.events[0]),
    { capability: "candidate", editPolicy: "read-only" },
  );
});

test("classifies undeclared, unsupported, unknown, and mixed History as read-only", () => {
  const undeclared = {
    version: "1.0",
    entities: [],
    events: [{ id: "event-1", extensions: { history: candidateHistory } }],
    relations: [],
  };
  assert.deepEqual(
    classifyHistoryCapability(undeclared, undeclared.events[0]),
    { capability: "unknown", editPolicy: "read-only" },
  );

  const unsupported = datasetWithHistory(
    { time: { year: 1969 } },
    "9.0.0",
  );
  assert.deepEqual(
    classifyHistoryCapability(unsupported, unsupported.events[0]),
    { capability: "unsupported", editPolicy: "read-only" },
  );

  const unknown = datasetWithHistory(
    { assertions: [{ ...candidateHistory.assertions[0], futureMeaning: true }] },
  );
  assert.deepEqual(
    classifyHistoryCapability(unknown, unknown.events[0]),
    { capability: "unknown", editPolicy: "read-only" },
  );

  const mixed = datasetWithHistory({
    time: { year: 1969 },
    assertions: candidateHistory.assertions,
  });
  assert.deepEqual(
    classifyHistoryCapability(mixed, mixed.events[0]),
    { capability: "mixed", editPolicy: "read-only" },
  );
});

test("History presentation ignores mixed payload time rather than sorting it as Stable", () => {
  const event = {
    id: "event-1",
    extensions: {
      history: {
        time: { year: 1969, month: 7, day: 20 },
        assertions: candidateHistory.assertions,
      },
    },
  };

  assert.equal(getEventHistoryDate(event), undefined);
});

test("Stable History writer refuses candidate and mixed payloads without mutation", () => {
  for (const history of [
    candidateHistory,
    { time: { year: 1969 }, assertions: candidateHistory.assertions },
  ]) {
    const dataset = datasetWithHistory(history);
    const original = structuredClone(dataset);

    assert.throws(
      () => updateEvent(dataset, "event-1", { historyDate: { year: 2026 } }),
      /History edit refused/,
    );
    assert.deepEqual(dataset, original);
  }
});
