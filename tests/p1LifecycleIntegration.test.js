import assert from "node:assert/strict";
import test from "node:test";
import { importDatasetJson } from "../src/services/DatasetService.ts";
import {
  applyPreclassifiedP1LifecycleOperation,
} from "../src/research/p1LifecycleExperiment.ts";
import { RESEARCH_P1_NAMES_EXTENSION_ID } from "../src/research/p1NameExpressionDiscovery.ts";

const input = {
  version: "1.0",
  entities: [
    {
      id: "names-entity",
      extensions: {
        [RESEARCH_P1_NAMES_EXTENSION_ID]: {
          expressions: [
            { id: "N1", value: "Alice", language: "en", script: "Latn", future: null },
            { id: "N-similar", value: "Alice", language: "en", script: "Latn", note: "unrelated" },
            { id: "N1", opaqueFutureData: true },
          ],
          opaque: ["keep", null, { nested: true }],
          opaqueReference: { targetId: "N1" },
        },
      },
    },
    { id: "unrelated-entity", name: "Unrelated", description: "unchanged" },
  ],
  events: [],
  relations: [],
};

function importedInput() {
  const result = importDatasetJson(JSON.stringify(input));
  assert.equal(result.isValid, true);
  assert.ok(result.dataset);
  assert.ok(result.issues.some(({ code }) => code === "unknown_extension"));
  return result.dataset;
}

test("observes pre-classified non-substantive identity continuity", () => {
  const dataset = importedInput();
  const before = structuredClone(dataset.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID]);
  assert.deepEqual(before.opaqueReference, { targetId: "N1" });
  const after = applyPreclassifiedP1LifecycleOperation(dataset, {
    kind: "pre-classified-non-substantive",
    entityId: "names-entity",
    expressionId: "N1",
    replacement: { id: "N1", value: "Alice", language: "en", script: "Latn", future: null },
  });

  assert.equal(after.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID].expressions[0].id, "N1");
  assert.deepEqual(after.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID].expressions, before.expressions);
  assert.deepEqual(after.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID].opaque, before.opaque);
  assert.deepEqual(after.entities[1], dataset.entities[1]);
});

test("observes supplied substantive replacement without allocating or retargeting", () => {
  const dataset = importedInput();
  const before = structuredClone(dataset.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID]);
  assert.deepEqual(before.opaqueReference, { targetId: "N1" });
  const after = applyPreclassifiedP1LifecycleOperation(dataset, {
    kind: "pre-classified-substantive-replacement",
    entityId: "names-entity",
    expressionId: "N1",
    replacement: { id: "N2", value: "Bob", language: "en", script: "Latn" },
  });
  const payload = after.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID];

  assert.equal(payload.expressions[0].id, "N2");
  assert.notEqual(payload.expressions[0].id, "N1");
  assert.deepEqual(payload.expressions.slice(1), before.expressions.slice(1));
  assert.deepEqual(payload.expressions[2], { id: "N1", opaqueFutureData: true });
  assert.deepEqual(payload.opaque, ["keep", null, { nested: true }]);
  assert.deepEqual(payload.opaqueReference, { targetId: "N1" });
  assert.equal(payload.expressions.some(
    (expression) => expression.id === "N1" && typeof expression.value === "string",
  ), false);
});

test("keeps an explicitly missing old target distinct from supplied N2", () => {
  const dataset = importedInput();
  const after = applyPreclassifiedP1LifecycleOperation(dataset, {
    kind: "pre-classified-substantive-replacement",
    entityId: "names-entity",
    expressionId: "N1",
    replacement: { id: "N2", value: "Bob", language: "en", script: "Latn" },
  });
  const payload = after.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID];

  assert.equal(payload.expressions.some(
    (expression) => expression.id === "N1" && typeof expression.value === "string",
  ), false);
  assert.equal(payload.expressions.some(({ id }) => id === "N2"), true);
  assert.deepEqual(payload.opaqueReference, { targetId: "N1" });
});
