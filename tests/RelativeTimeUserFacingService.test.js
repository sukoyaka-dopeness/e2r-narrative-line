import assert from "node:assert/strict";
import test from "node:test";
import { exportDatasetJson, importDatasetJson } from "../src/services/DatasetService.ts";
import { validateCoreDataset } from "../src/services/ValidationService.ts";
import {
  applyRelativeTimeOperation,
  canStartRelativeTimeAuthoring,
  classifyRelativeTimeEvidence,
  createRelativeTimeAssertion,
  getEditableRelativeTimeAssertions,
  isRelativeTimeProjectionEligibleEvent,
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

test("Relative Time presentation evidence distinguishes absent, supported, and diagnostic data", () => {
  assert.equal(classifyRelativeTimeEvidence(blankDataset()), "off");
  const supported = declaredDataset(undefined, [assertion("rt1", "a", "b", "before")]);
  assert.equal(classifyRelativeTimeEvidence(supported), "on");

  const declarationOnly = declaredDataset();
  assert.equal(classifyRelativeTimeEvidence(declarationOnly), "diagnostic");

  const malformed = declaredDataset(undefined, [
    { ...assertion("rt1", "a", "b", "before"), extensions: {
      [RELATIVE_TIME_EXTENSION_ID]: { type: "relative-position", relation: "future" },
    } },
  ]);
  assert.equal(classifyRelativeTimeEvidence(malformed), "diagnostic");

  const partiallyRecognized = declaredDataset(undefined, [
    assertion("rt1", "a", "b", "before"),
    { id: "rt2", sourceId: "b", targetId: "c", extensions: {
      [RELATIVE_TIME_EXTENSION_ID]: { type: "future-feature", value: true },
    } },
  ]);
  assert.equal(classifyRelativeTimeEvidence(partiallyRecognized), "diagnostic");
});

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

test("unrelated History 1 and circa Events do not block eligible Relative Time create or update", () => {
  const historyCases = [
    {
      label: "History 1",
      event: { id: "dated", extensions: { history: { time: { year: 1900 } } } },
      use: { extension: "history", version: "1.0.0" },
    },
    {
      label: "History 2 circa",
      event: {
        id: "circa",
        extensions: {
          history: {
            assertions: [{
              id: "position-circa",
              type: "position",
              position: { year: 1900, approximation: "circa" },
            }],
          },
        },
      },
      use: { extension: "history", version: "2.0.0", features: ["approximation"] },
    },
  ];

  for (const { label, event, use } of historyCases) {
    const relationId = label === "History 1" ? "rt-history-1" : "rt-history-2-circa";
    const source = {
      ...blankDataset(),
      events: [...blankDataset().events, event],
      extensions: {
        metadata: { datasetId: "rt-test" },
        [specificationId]: {
          specVersion: "0.1.0",
          uses: [
            { extension: "metadata", version: "1.0.0" },
            use,
          ],
        },
      },
    };
    const before = structuredClone(source);

    const created = createRelativeTimeAssertion(source, "a", "b", true, relationId);
    assert.equal(created.ok, true, `${label} create`);
    assert.deepEqual(source, before, `${label} source remains immutable`);
    assert.deepEqual(created.dataset.events.at(-1), event, `${label} payload is preserved`);

    const updated = updateRelativeTimeAssertion(created.dataset, relationId, "a", false);
    assert.equal(updated.ok, true, `${label} update`);
    assert.equal(updated.dataset.relations[0].id, relationId, `${label} Relation identity`);
    assert.equal(
      updated.dataset.relations[0].extensions[RELATIVE_TIME_EXTENSION_ID].relation,
      "before",
      `${label} direction update`,
    );
    assert.deepEqual(updated.dataset.events.at(-1), event, `${label} History remains unchanged`);
  }
});

test("Recorded authoring supports History 1, History 2 circa, and legacy-date endpoints", () => {
  const historyVariants = [
    {
      label: "History 1",
      event: (id) => ({ id, extensions: { history: { time: { year: 1900 } } } }),
      use: { extension: "history", version: "1.0.0" },
    },
    {
      label: "History 2 circa",
      event: (id) => ({
        id,
        extensions: {
          history: {
            assertions: [{
              id: `position-circa-${id}`,
              type: "position",
              position: { year: 1900, approximation: "circa" },
            }],
          },
        },
      }),
      use: { extension: "history", version: "2.0.0", features: ["approximation"] },
    },
    {
      label: "legacy date",
      event: (id) => ({ id, date: "1900-01-01" }),
    },
  ];
  const pairShapes = [
    { label: "dated to undated", dateA: true, dateB: false },
    { label: "undated to dated", dateA: false, dateB: true },
    { label: "dated to dated", dateA: true, dateB: true },
  ];

  for (const variant of historyVariants) {
    for (const shape of pairShapes) {
      const eventA = shape.dateA ? variant.event("a") : { id: "a", name: "A" };
      const eventB = shape.dateB ? variant.event("b") : { id: "b", name: "B" };
      const dataset = {
        ...blankDataset(),
        events: [eventA, eventB],
        extensions: {
          metadata: { datasetId: "rt-test" },
          [specificationId]: {
            specVersion: "0.1.0",
            uses: [
              { extension: "metadata", version: "1.0.0" },
              ...(variant.use ? [variant.use] : []),
            ],
          },
        },
      };
      const historyBefore = structuredClone([eventA, eventB]);
      const historyUsesBefore = structuredClone(
        dataset.extensions[specificationId].uses.filter(({ extension }) => extension === "history"),
      );
      const relationId = `rt-${variant.label}-${shape.label}`;

      const created = createRelativeTimeAssertion(dataset, "a", "b", true, relationId);
      assert.equal(created.ok, true, `${variant.label}, ${shape.label} create`);
      assert.deepEqual(created.dataset.events, historyBefore, `${variant.label}, ${shape.label} History is preserved`);
      assert.deepEqual(
        created.dataset.extensions[specificationId].uses.filter(({ extension }) => extension === "history"),
        historyUsesBefore,
        `${variant.label}, ${shape.label} History declaration is preserved`,
      );
      assert.deepEqual(
        getEditableRelativeTimeAssertions(created.dataset, "a").map(({ relation }) => relation.id),
        [relationId],
        `${variant.label}, ${shape.label} visible at source Event`,
      );
      assert.deepEqual(
        getEditableRelativeTimeAssertions(created.dataset, "b").map(({ relation }) => relation.id),
        [relationId],
        `${variant.label}, ${shape.label} visible at target Event`,
      );

      const updated = updateRelativeTimeAssertion(created.dataset, relationId, "b", true);
      assert.equal(updated.ok, true, `${variant.label}, ${shape.label} update`);
      assert.equal(updated.dataset.relations[0].id, relationId);
      assert.equal(updated.dataset.relations[0].sourceId, "a");
      assert.equal(updated.dataset.relations[0].targetId, "b");
      assert.equal(
        updated.dataset.relations[0].extensions[RELATIVE_TIME_EXTENSION_ID].relation,
        "before",
      );
      assert.deepEqual(updated.dataset.events, historyBefore, `${variant.label}, ${shape.label} update leaves History unchanged`);
      assert.deepEqual(
        updated.dataset.extensions[specificationId].uses.filter(({ extension }) => extension === "history"),
        historyUsesBefore,
        `${variant.label}, ${shape.label} update leaves History declaration unchanged`,
      );
      assert.deepEqual(projectRelativeTimeForTimeline(updated.dataset).groups, [], "mixed/dated relations stay outside projection");

      const exported = exportDatasetJson(updated.dataset);
      assert.equal(exported.isValid, true, `${variant.label}, ${shape.label} export validates`);
      if (variant.label === "legacy date") {
        assert.deepEqual(JSON.parse(exported.json), updated.dataset);
      } else {
        assert.deepEqual(importDatasetJson(exported.json).dataset, updated.dataset);
      }
    }
  }
});

test("a Relation remains visible and editable after History is added to an endpoint", () => {
  const initial = blankDataset();
  const created = createRelativeTimeAssertion(initial, "a", "b", true, "rt-before-history");
  assert.equal(created.ok, true);
  const historyUse = { extension: "history", version: "1.0.0" };
  const historyEvent = {
    ...created.dataset.events[0],
    extensions: { history: { time: { year: 1900, month: 4 } } },
  };
  const withHistory = {
    ...created.dataset,
    events: [historyEvent, ...created.dataset.events.slice(1)],
    extensions: {
      ...created.dataset.extensions,
      [specificationId]: {
        ...created.dataset.extensions[specificationId],
        uses: [...created.dataset.extensions[specificationId].uses, historyUse],
      },
    },
  };
  const historyBefore = structuredClone(historyEvent.extensions.history);
  const historyUsesBefore = structuredClone(
    withHistory.extensions[specificationId].uses.filter(({ extension }) => extension === "history"),
  );

  assert.deepEqual(
    getEditableRelativeTimeAssertions(withHistory, "a").map(({ relation }) => relation.id),
    ["rt-before-history"],
  );
  const updated = updateRelativeTimeAssertion(withHistory, "rt-before-history", "a", false);
  assert.equal(updated.ok, true);
  assert.equal(updated.dataset.relations[0].id, "rt-before-history");
  assert.equal(updated.dataset.relations[0].sourceId, "a");
  assert.equal(updated.dataset.relations[0].targetId, "b");
  assert.equal(updated.dataset.relations[0].extensions[RELATIVE_TIME_EXTENSION_ID].relation, "before");
  assert.deepEqual(updated.dataset.events[0].extensions.history, historyBefore);
  assert.deepEqual(
    updated.dataset.extensions[specificationId].uses.filter(({ extension }) => extension === "history"),
    historyUsesBefore,
  );
  assert.deepEqual(projectRelativeTimeForTimeline(updated.dataset).groups, []);

  const exported = exportDatasetJson(updated.dataset);
  assert.equal(exported.isValid, true);
  assert.deepEqual(importDatasetJson(exported.json).dataset, updated.dataset);
});

test("Relative Time refuses an invalid Dataset that mixes History 1 and History 2 without repair", () => {
  const dataset = declaredDataset([
    ...blankDataset().events,
    { id: "h1", extensions: { history: { time: { year: 1900 } } } },
    {
      id: "h2-circa",
      extensions: {
        history: {
          assertions: [{
            id: "h2-position",
            type: "position",
            position: { year: 1901, approximation: "circa" },
          }],
        },
      },
    },
  ], [assertion("existing", "a", "b", "after")]);
  dataset.extensions[specificationId].uses.push({
    extension: "history",
    version: "2.0.0",
    features: ["approximation"],
  });
  const before = structuredClone(dataset);

  assert.equal(validateCoreDataset(dataset).isValid, false);
  assert.deepEqual(
    createRelativeTimeAssertion(dataset, "a", "c", true, "new-assertion"),
    { ok: false, reason: "invalid_dataset" },
  );
  assert.deepEqual(
    updateRelativeTimeAssertion(dataset, "existing", "a", false),
    { ok: false, reason: "invalid_dataset" },
  );
  assert.deepEqual(dataset, before);
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

test("reversing one Recorded assertion through its other endpoint replaces that Relation without a duplicate", () => {
  const source = blankDataset();
  const first = createRelativeTimeAssertion(source, "a", "b", true, "relation-ab");
  assert.equal(first.ok, true);
  const chain = createRelativeTimeAssertion(first.dataset, "b", "c", true, "relation-bc");
  assert.equal(chain.ok, true);

  const updated = updateRelativeTimeAssertion(chain.dataset, "relation-ab", "b", true);

  assert.equal(updated.ok, true);
  assert.deepEqual(updated.dataset.relations.map(({ id }) => id), ["relation-ab", "relation-bc"]);
  assert.equal(updated.dataset.relations[0].sourceId, "a");
  assert.equal(updated.dataset.relations[0].targetId, "b");
  assert.equal(
    updated.dataset.relations[0].extensions[RELATIVE_TIME_EXTENSION_ID].relation,
    "before",
  );
  assert.equal(
    updated.dataset.relations[1].extensions[RELATIVE_TIME_EXTENSION_ID].relation,
    "after",
  );
  assert.deepEqual(projectRelativeTimeForTimeline(updated.dataset).conflictedEventIds, []);
  assert.deepEqual(projectRelativeTimeForTimeline(updated.dataset).groups[0].eventIdsByDisplayBand, [
    ["b"],
    ["a", "c"],
  ]);
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
  assert.equal(isRelativeTimeProjectionEligibleEvent(dataset, events[3]), false);
  assert.equal(isRelativeTimeProjectionEligibleEvent(dataset, events[4]), false);
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
