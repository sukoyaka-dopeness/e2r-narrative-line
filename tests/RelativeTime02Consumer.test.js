import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  exportDatasetJson,
  importDatasetJson,
} from "../src/services/DatasetService.ts";
import { updateEvent } from "../src/services/EventService.ts";
import { compareEventsByHistoryDate } from "../src/services/HistoryService.ts";

const relativeTimeId = "draft.github.sukoyaka-dopeness.relative-time";
const specificationId = "draft.github.sukoyaka-dopeness.specification";

async function fixture(path) {
  return JSON.parse(await readFile(new URL(`../../e2r-spec/${path}`, import.meta.url), "utf8"));
}

test("published Validator recognizes exact 0.2.0 and preserves its declaration, Relations, and unknown siblings after an unrelated edit", async () => {
  const original = await fixture("examples/relative-time-0.2-draft/all-families.json");
  original.futureDatasetField = { retained: true };
  original.relations[0].futureRelationField = { retained: true };

  const imported = importDatasetJson(JSON.stringify(original));
  assert.equal(imported.isValid, true);
  assert.deepEqual(imported.issues, []);

  const edited = updateEvent(imported.dataset, "target-1", { description: "Unrelated note" });
  const exported = exportDatasetJson(edited);
  assert.equal(exported.isValid, true);
  const result = JSON.parse(exported.json);
  assert.deepEqual(result.extensions[specificationId], original.extensions[specificationId]);
  assert.deepEqual(result.relations, original.relations);
  assert.deepEqual(result.futureDatasetField, original.futureDatasetField);
  assert.equal(result.events.find(({ id }) => id === "target-1").description, "Unrelated note");

  const reimported = importDatasetJson(exported.json);
  assert.equal(reimported.isValid, true);
  assert.deepEqual(reimported.dataset, result);
  const withoutRelativeTime = { ...result, relations: [] };
  assert.equal(
    compareEventsByHistoryDate(result.events[0], result.events[1], result),
    compareEventsByHistoryDate(result.events[0], result.events[1], withoutRelativeTime),
  );
});

test("0.1.0 remains a separate supported contract", async () => {
  const original = await fixture("examples/relative-time-draft/all-families.json");
  const imported = importDatasetJson(JSON.stringify(original));
  assert.equal(imported.isValid, true);
  assert.deepEqual(imported.issues, []);
  assert.equal(JSON.parse(exportDatasetJson(imported.dataset).json).extensions[specificationId].uses[0].version, "0.1.0");
});

test("invalid 0.2.0 declaration and payload use the generic validator diagnostics", async () => {
  const original = await fixture("examples/relative-time-0.2-draft/all-families.json");
  const wrongFeature = structuredClone(original);
  wrongFeature.extensions[specificationId].uses[0].features = ["relative-position"];
  const featureResult = importDatasetJson(JSON.stringify(wrongFeature));
  assert.equal(featureResult.isValid, false);
  assert.ok(featureResult.issues.some(({ code, path }) => code && path));

  const wrongPayload = structuredClone(original);
  wrongPayload.relations[0].extensions[relativeTimeId].relation = "meets";
  const payloadResult = importDatasetJson(JSON.stringify(wrongPayload));
  assert.equal(payloadResult.isValid, false);
  assert.ok(payloadResult.issues.some(({ code, path }) => code && path.includes("relations")));
});

test("unsupported exact version remains opaque and is never interpreted as 0.2.0", async () => {
  const original = await fixture("examples/relative-time-0.2-draft/all-families.json");
  const unsupported = structuredClone(original);
  unsupported.extensions[specificationId].uses[0].version = "0.3.0";
  unsupported.relations[0].extensions[relativeTimeId].relation = "future-relation";
  const imported = importDatasetJson(JSON.stringify(unsupported));
  assert.equal(imported.isValid, true);
  assert.ok(imported.issues.some(({ severity }) => severity === "warning"));
  const exported = exportDatasetJson(imported.dataset);
  assert.equal(exported.isValid, true);
  assert.deepEqual(JSON.parse(exported.json), unsupported);
});

test("NarrativeLine does not invent a Relative Time declaration for an undeclared payload", async () => {
  const dataset = await fixture("examples/relative-time-0.2-draft/all-families.json");
  delete dataset.extensions;
  const imported = importDatasetJson(JSON.stringify(dataset));
  assert.equal(imported.isValid, true);
  const exported = exportDatasetJson(imported.dataset);
  assert.equal(exported.isValid, true);
  assert.deepEqual(JSON.parse(exported.json), dataset);
});
