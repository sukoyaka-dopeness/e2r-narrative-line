import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  exportDatasetJson,
  importDatasetJson,
} from "../src/services/DatasetService.ts";
import { updateEvent } from "../src/services/EventService.ts";
import { classifyHistoryCapability } from "../src/services/HistoryCapabilityService.ts";

async function readSpecExample(path) {
  return readFile(new URL(`../../e2r-spec/${path}`, import.meta.url), "utf8");
}

test("opens, preserves, exports, and re-imports an exact History 2 candidate", async () => {
  const source = await readSpecExample("examples/history-2.0-draft/position.json");
  const original = JSON.parse(source);
  const imported = importDatasetJson(source);

  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);
  assert.equal(
    classifyHistoryCapability(imported.dataset, imported.dataset.events[0]).capability,
    "candidate",
  );

  const updated = updateEvent(imported.dataset, "event-position", {
    description: "Unrelated note",
  });
  const exported = exportDatasetJson(updated);

  assert.equal(exported.isValid, true);
  assert.ok(exported.json);
  const exportedDataset = JSON.parse(exported.json);
  assert.deepEqual(exportedDataset.events[0].extensions.history, original.events[0].extensions.history);
  assert.deepEqual(exportedDataset.extensions["draft.github.sukoyaka-dopeness.specification"], original.extensions["draft.github.sukoyaka-dopeness.specification"]);
  assert.equal("time" in exportedDataset.events[0].extensions.history, false);

  const reimported = importDatasetJson(exported.json);
  assert.equal(reimported.isValid, true);
  assert.deepEqual(reimported.dataset.events[0].extensions.history, original.events[0].extensions.history);
});

test("does not invent a History declaration for an undeclared candidate-shaped payload", () => {
  const dataset = {
    version: "1.0",
    entities: [],
    events: [{
      id: "event-1",
      name: "Candidate Event",
      extensions: {
        history: {
          assertions: [{
            id: "position-1",
            type: "position",
            position: { year: 1969 },
          }],
        },
      },
    }],
    relations: [],
  };

  const result = exportDatasetJson(dataset);
  assert.equal(result.isValid, true);
  assert.ok(result.json);
  const exported = JSON.parse(result.json);
  assert.deepEqual(exported, dataset);
  assert.equal(exported.extensions, undefined);
});

test("preserves Relative Time payloads without using them for History or Timeline behavior", async () => {
  const source = await readSpecExample("examples/relative-time-draft/all-families.json");
  const imported = importDatasetJson(source);
  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);

  const exported = exportDatasetJson(imported.dataset);
  assert.equal(exported.isValid, true);
  assert.ok(exported.json);
  assert.deepEqual(JSON.parse(exported.json), JSON.parse(source));
});
