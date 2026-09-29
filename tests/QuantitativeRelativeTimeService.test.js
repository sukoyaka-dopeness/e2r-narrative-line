import assert from "node:assert/strict";
import test from "node:test";
import { exportDatasetJson, importDatasetJson } from "../src/services/DatasetService.ts";
import { updateEvent } from "../src/services/EventService.ts";
import { classifyRelativeTimeEvidence } from "../src/services/RelativeTimeService.ts";
import { applyQuantitativeOperation, getQuantitativeRelations } from "../src/services/QuantitativeRelativeTimeService.ts";
import { getQuantitativeTimeCandidates } from "../src/services/QuantitativeTimeCandidateService.ts";

const relativeId = "draft.github.sukoyaka-dopeness.relative-time";
const specificationId = "draft.github.sukoyaka-dopeness.specification";

function dataset() {
  return {
    version: "1.0", entities: [], relations: [],
    events: [
      { id: "a", name: "A", extensions: { history: { time: { year: 2024, month: 1, day: 31, hour: 23, minute: 0 } } } },
      { id: "b", name: "B" },
      { id: "c", name: "C", extensions: { history: { time: { year: 2024, month: 3, day: 1, hour: 1, minute: 0 } } } },
    ],
    extensions: {
      metadata: { datasetId: "quantitative-test" },
      [specificationId]: { specVersion: "0.1.0", uses: [
        { extension: "metadata", version: "1.0.0" },
        { extension: "history", version: "1.0.0" },
      ] },
    },
  };
}

test("calendar and elapsed assertions are separate declared Relations and survive export/import", () => {
  const source = dataset();
  const calendar = applyQuantitativeOperation(source, {
    type: "create", relationId: "calendar", sourceId: "a", targetId: "b",
    payload: { type: "calendar-granule-relation", granularity: "month", displacement: 1 },
  });
  assert.equal(calendar.ok, true);
  const elapsed = applyQuantitativeOperation(calendar.dataset, {
    type: "create", relationId: "elapsed", sourceId: "a", targetId: "b",
    payload: { type: "elapsed-offset", direction: "after", value: 2, unit: "hour" },
  });
  assert.equal(elapsed.ok, true);
  assert.equal(elapsed.dataset.relations.length, 2);
  assert.deepEqual(elapsed.dataset.events, source.events);
  assert.deepEqual(elapsed.dataset.extensions[specificationId].uses.at(-1).features,
    ["calendar-granule-relation", "elapsed-offset"]);
  assert.equal(classifyRelativeTimeEvidence(elapsed.dataset), "on");
  const exported = exportDatasetJson(elapsed.dataset);
  assert.equal(exported.isValid, true);
  const reimported = importDatasetJson(exported.json);
  assert.equal(reimported.isValid, true);
  assert.deepEqual(reimported.dataset, elapsed.dataset);
});

test("one-hop candidates retain each Relation's provenance and never write History", () => {
  const base = dataset();
  const first = applyQuantitativeOperation(base, {
    type: "create", relationId: "month", sourceId: "a", targetId: "b",
    payload: { type: "calendar-granule-relation", granularity: "month", displacement: 1 },
  }).dataset;
  const second = applyQuantitativeOperation(first, {
    type: "create", relationId: "two-hours", sourceId: "a", targetId: "b",
    payload: { type: "elapsed-offset", direction: "after", value: 2, unit: "hour" },
  }).dataset;
  const candidates = getQuantitativeTimeCandidates(second, "b");
  assert.deepEqual(candidates.map(({ relationId, date }) => ({ relationId, date })), [
    { relationId: "month", date: { year: 2024, month: 2 } },
    { relationId: "two-hours", date: { year: 2024, month: 2, day: 1, hour: 1, minute: 0 } },
  ]);
  assert.deepEqual(second.events, base.events);
  assert.deepEqual(getQuantitativeTimeCandidates(second, "c"), []);
});

test("reverse direction derives only from the directly connected dated target", () => {
  const base = dataset();
  const result = applyQuantitativeOperation(base, {
    type: "create", relationId: "reverse", sourceId: "b", targetId: "c",
    payload: { type: "calendar-granule-relation", granularity: "day", displacement: 1 },
  });
  assert.equal(result.ok, true);
  assert.deepEqual(getQuantitativeTimeCandidates(result.dataset, "b")[0].date,
    { year: 2024, month: 2, day: 29 });
  const elapsed = applyQuantitativeOperation(result.dataset, {
    type: "create", relationId: "reverse-elapsed", sourceId: "b", targetId: "c",
    payload: { type: "elapsed-offset", direction: "after", value: 2, unit: "hour" },
  });
  assert.equal(elapsed.ok, true);
  assert.deepEqual(getQuantitativeTimeCandidates(elapsed.dataset, "b").map(({ date }) => date), [
    { year: 2024, month: 2, day: 29 },
    { year: 2024, month: 2, day: 29, hour: 23, minute: 0 },
  ]);
});

test("editing preserves Relation identity and unknown siblings; deleting removes only the selected Relation", () => {
  const created = applyQuantitativeOperation(dataset(), {
    type: "create", relationId: "one", sourceId: "a", targetId: "b",
    payload: { type: "elapsed-offset", direction: "after", value: 1, unit: "hour" },
  }).dataset;
  created.relations[0].extensions[relativeId].futureField = "keep";
  const edited = applyQuantitativeOperation(created, {
    type: "update", relationId: "one",
    payload: { type: "elapsed-offset", direction: "before", value: 3, unit: "minute" },
  });
  assert.equal(edited.ok, true);
  assert.equal(edited.dataset.relations[0].id, "one");
  assert.equal(edited.dataset.relations[0].extensions[relativeId].futureField, "keep");
  const deleted = applyQuantitativeOperation(edited.dataset, { type: "delete", relationId: "one" });
  assert.equal(deleted.ok, true);
  assert.deepEqual(deleted.dataset.relations, []);
  assert.equal(classifyRelativeTimeEvidence(deleted.dataset), "off");
  assert.deepEqual(deleted.dataset.events, created.events);
});

test("unsupported exact versions and independently owned Relation payloads refuse mutation", () => {
  const created = applyQuantitativeOperation(dataset(), {
    type: "create", relationId: "one", sourceId: "a", targetId: "b",
    payload: { type: "elapsed-offset", direction: "after", value: 1, unit: "hour" },
  }).dataset;
  const unsupported = structuredClone(created);
  unsupported.extensions[specificationId].uses.at(-1).version = "0.3.0";
  assert.equal(applyQuantitativeOperation(unsupported, { type: "delete", relationId: "one" }).ok, false);
  const shared = structuredClone(created);
  shared.relations[0].extensions.future = { retained: true };
  assert.equal(applyQuantitativeOperation(shared, { type: "delete", relationId: "one" }).ok, false);
  assert.ok(getQuantitativeRelations(created, "b").length === 1);
});

test("qualitative and quantitative Relations coexist without merging or inferring an ordering Relation", () => {
  const base = dataset();
  base.relations.push({ id: "qualitative", sourceId: "a", targetId: "b", extensions: {
    [relativeId]: { type: "relative-position", relation: "after" },
  } });
  base.extensions[specificationId].uses.push({ extension: relativeId, version: "0.2.0", features: ["relative-position"] });
  const created = applyQuantitativeOperation(base, {
    type: "create", relationId: "quantitative", sourceId: "a", targetId: "b",
    payload: { type: "elapsed-offset", direction: "after", value: 1, unit: "hour" },
  });
  assert.equal(created.ok, true);
  assert.equal(created.dataset.relations.length, 2);
  assert.deepEqual(created.dataset.relations[0], base.relations[0]);
  assert.deepEqual(created.dataset.extensions[specificationId].uses.at(-1).features,
    ["elapsed-offset", "relative-position"]);
  assert.equal(classifyRelativeTimeEvidence(created.dataset), "on");
});

test("coarse anchors do not invent missing History fields or elapsed precision", () => {
  const base = dataset();
  base.events[0].extensions.history.time = { year: 2024 };
  const calendar = applyQuantitativeOperation(base, {
    type: "create", relationId: "calendar", sourceId: "a", targetId: "b",
    payload: { type: "calendar-granule-relation", granularity: "month", displacement: 1 },
  }).dataset;
  const elapsed = applyQuantitativeOperation(calendar, {
    type: "create", relationId: "elapsed", sourceId: "a", targetId: "b",
    payload: { type: "elapsed-offset", direction: "after", value: 1, unit: "hour" },
  }).dataset;
  assert.deepEqual(getQuantitativeTimeCandidates(elapsed, "b"), []);
});

test("a single exact History 2 position can anchor a direct candidate", () => {
  const value = {
    version: "1.0", entities: [],
    events: [
      { id: "a", extensions: { history: { assertions: [{ id: "position-1", type: "position", position: { year: 1969, month: 7, day: 20 } }] } } },
      { id: "b" },
    ],
    relations: [{ id: "one", sourceId: "a", targetId: "b", extensions: {
      [relativeId]: { type: "calendar-granule-relation", granularity: "day", displacement: 1 },
    } }],
    extensions: { [specificationId]: { specVersion: "0.1.0", uses: [
      { extension: "history", version: "2.0.0" },
      { extension: relativeId, version: "0.2.0", features: ["calendar-granule-relation"] },
    ] } },
  };
  assert.deepEqual(getQuantitativeTimeCandidates(value, "b")[0].date,
    { year: 1969, month: 7, day: 21 });
  const withRecordedHistory = updateEvent(value, "b", {
    history2Position: { position: getQuantitativeTimeCandidates(value, "b")[0].date, approximation: false },
  });
  assert.equal(exportDatasetJson(withRecordedHistory).isValid, true);
  assert.deepEqual(withRecordedHistory.relations, value.relations);
  assert.deepEqual(withRecordedHistory.events[1].extensions.history.assertions[0].position,
    { year: 1969, month: 7, day: 21 });
});
