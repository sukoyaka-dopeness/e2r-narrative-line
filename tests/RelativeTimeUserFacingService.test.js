import assert from "node:assert/strict";
import test from "node:test";
import { exportDatasetJson, importDatasetJson } from "../src/services/DatasetService.ts";
import {
  applyRelativeTimeOperation,
  canStartRelativeTimeAuthoring,
  createRelativeTimeAssertion,
  getEditableRelativeTimeAssertions,
  isRelativeTimeEligibleEvent,
  projectRelativeTimeForTimeline,
  RELATIVE_TIME_EXTENSION_ID,
  updateRelativeTimeAssertion,
} from "../src/services/RelativeTimeService.ts";

const specificationId = "draft.github.sukoyaka-dopeness.specification";

function blankDataset() {
  return {
    version: "1.0",
    entities: [],
    events: [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }],
    relations: [],
    extensions: { metadata: { datasetId: "rt-test" } },
  };
}

function declaredDataset(events = blankDataset().events, relations = []) {
  return {
    ...blankDataset(),
    events,
    relations,
    extensions: {
      metadata: { datasetId: "rt-test" },
      [specificationId]: {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          {
            extension: RELATIVE_TIME_EXTENSION_ID,
            version: "0.2.0",
            features: ["relative-position"],
          },
        ],
      },
    },
  };
}

function assertion(id, sourceId, targetId, relation) {
  return {
    id,
    sourceId,
    targetId,
    extensions: {
      [RELATIVE_TIME_EXTENSION_ID]: { type: "relative-position", relation },
    },
  };
}

test("first explicit authoring records exact 0.2.0 and qualitative before/after without inverse Relation", () => {
  const source = blankDataset();
  const result = createRelativeTimeAssertion(source, "a", "b", true, "rt1");
  assert.equal(result.ok, true);
  assert.deepEqual(source.relations, []);
  assert.equal(result.dataset.relations.length, 1);
  assert.deepEqual(result.dataset.relations[0], {
    id: "rt1",
    sourceId: "a",
    targetId: "b",
    extensions: {
      [RELATIVE_TIME_EXTENSION_ID]: { type: "relative-position", relation: "after" },
    },
  });
  assert.deepEqual(
    result.dataset.extensions[specificationId].uses.find(({ extension }) => extension === RELATIVE_TIME_EXTENSION_ID),
    { extension: RELATIVE_TIME_EXTENSION_ID, version: "0.2.0", features: ["relative-position"] },
  );
  const exported = exportDatasetJson(result.dataset);
  assert.equal(exported.isValid, true);
  assert.deepEqual(importDatasetJson(exported.json).dataset, result.dataset);
});

test("refuses old or unsupported exact versions and direct contradictions without changing input", () => {
  const old = declaredDataset();
  old.extensions[specificationId].uses.find(({ extension }) => extension === RELATIVE_TIME_EXTENSION_ID).version = "0.1.0";
  const beforeOld = structuredClone(old);
  assert.equal(canStartRelativeTimeAuthoring(old), false);
  assert.equal(createRelativeTimeAssertion(old, "a", "b", true, "x").ok, false);
  assert.deepEqual(old, beforeOld);

  const unsupported = declaredDataset();
  unsupported.extensions[specificationId].uses.find(({ extension }) => extension === RELATIVE_TIME_EXTENSION_ID).version = "0.3.0";
  assert.equal(canStartRelativeTimeAuthoring(unsupported), false);
  assert.equal(createRelativeTimeAssertion(unsupported, "a", "b", true, "x").ok, false);

  const conflict = declaredDataset(undefined, [assertion("existing", "a", "b", "after")]);
  const beforeConflict = structuredClone(conflict);
  const result = createRelativeTimeAssertion(conflict, "a", "b", false, "new");
  assert.deepEqual(result, { ok: false, reason: "contradiction" });
  assert.deepEqual(conflict, beforeConflict);

  const incomplete = blankDataset();
  incomplete.events[0].extensions = { "unowned.extension": { opaque: true } };
  assert.equal(canStartRelativeTimeAuthoring(incomplete), false);
  assert.equal(createRelativeTimeAssertion(incomplete, "a", "b", true, "x").ok, false);
});

test("separate imported assertions remain individually editable and preserve sibling payload data", () => {
  const dataset = declaredDataset(undefined, [
    {
      ...assertion("one", "a", "b", "after"),
      futureRelationField: { keep: true },
    },
    assertion("two", "b", "a", "after"),
  ]);
  dataset.futureDatasetField = { retained: true };
  const assertions = getEditableRelativeTimeAssertions(dataset, "a");
  assert.deepEqual(assertions.map(({ relation }) => relation.id), ["one", "two"]);
  const updated = updateRelativeTimeAssertion(dataset, "one", "a", false);
  assert.equal(updated.ok, true);
  assert.equal(updated.dataset.relations[0].extensions[RELATIVE_TIME_EXTENSION_ID].relation, "before");
  assert.deepEqual(updated.dataset.relations[0].futureRelationField, { keep: true });
  assert.deepEqual(updated.dataset.futureDatasetField, { retained: true });
  assert.equal(updated.dataset.relations[1].extensions[RELATIVE_TIME_EXTENSION_ID].relation, "after");
});

test("projection follows qualitative direction, uses constraint chains for presentation, and retains incomparability", () => {
  const dataset = declaredDataset(undefined, [
    assertion("ab", "a", "b", "after"), // A before B
    assertion("bc", "b", "c", "after"), // B before C
  ]);
  const result = projectRelativeTimeForTimeline(dataset);
  assert.deepEqual(result.conflictedEventIds, []);
  assert.deepEqual(result.groups[0].eventIdsByDisplayBand, [["a"], ["b"], ["c"]]);
  assert.deepEqual(result.groups[0].incomparablePairs, []);

  const partial = declaredDataset(undefined, [
    assertion("ac", "a", "c", "after"),
    assertion("bc", "b", "c", "after"),
  ]);
  assert.deepEqual(projectRelativeTimeForTimeline(partial).groups[0].incomparablePairs, [["a", "b"]]);
});

test("cycles suppress only the affected projection group; partial and History-ordered Events are excluded", () => {
  const events = [
    { id: "a" }, { id: "b" }, { id: "c" },
    { id: "partial", extensions: { history: { time: { year: 1900 } } } },
    { id: "ordered", extensions: { history: { time: { year: 1900, temporalOrder: 1 } } } },
  ];
  const dataset = declaredDataset(events, [
    assertion("ab", "a", "b", "after"),
    assertion("ba", "b", "a", "after"),
    assertion("bc", "b", "c", "after"),
    assertion("cp", "c", "partial", "after"),
    assertion("co", "c", "ordered", "after"),
  ]);
  assert.equal(isRelativeTimeEligibleEvent(dataset, events[3]), false);
  assert.equal(isRelativeTimeEligibleEvent(dataset, events[4]), false);
  const projection = projectRelativeTimeForTimeline(dataset);
  assert.deepEqual(projection.conflictedEventIds, [["a", "b", "c"]]);
  assert.deepEqual(projection.groups, []);
});

test("App operations re-evaluate against current state and do not persist projection output", () => {
  const source = blankDataset();
  const operation = {
    type: "create",
    currentEventId: "a",
    otherEventId: "b",
    currentBeforeOther: true,
    relationId: "persisted-only-assertion",
  };
  const result = applyRelativeTimeOperation(source, operation);
  assert.equal(result.ok, true);
  assert.equal(result.dataset.events.some(({ id }) => id === "a" && id === "b"), false);
  assert.equal(result.dataset.relations.length, 1);
  assert.equal(JSON.stringify(result.dataset).includes("temporalOrder"), false);
});
