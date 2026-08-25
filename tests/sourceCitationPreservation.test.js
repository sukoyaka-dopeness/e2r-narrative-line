import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  exportDatasetJson,
  importDatasetJson,
} from "../src/services/DatasetService.ts";

test("preserves the Source/Citation research fixture through NarrativeLine load/save", async () => {
  const source = await readFile(
    new URL("../../e2r-spec/examples/research/source-citation/conceptual-roundtrip.json", import.meta.url),
    "utf8",
  );
  const original = JSON.parse(source);
  const imported = importDatasetJson(source);

  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);
  assert.ok(imported.issues.some(({ code }) => code === "unknown_extension"));

  const exported = exportDatasetJson(imported.dataset);
  assert.equal(exported.isValid, true);
  assert.ok(exported.json);
  assert.deepEqual(JSON.parse(exported.json), original);
});

test("preserves the unsupported Lineage Draft through NarrativeLine load, edit, and export", async () => {
  const source = await readFile(
    new URL("../../e2r-spec/research/exploratory/fixtures/lineage-extension-candidate.json", import.meta.url),
    "utf8",
  );
  const original = JSON.parse(source);
  const lineageId = "draft.github.sukoyaka-dopeness.lineage";
  original.extensions[lineageId].futureSentinel = { token: "preserve-me" };

  const imported = importDatasetJson(JSON.stringify(original));
  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);
  assert.deepEqual(imported.dataset.extensions?.[lineageId], original.extensions[lineageId]);

  imported.dataset.entities[0].name = "Edited unrelated Entity name";
  const exported = exportDatasetJson(imported.dataset);
  assert.equal(exported.isValid, true);
  assert.ok(exported.json);

  const saved = JSON.parse(exported.json);
  assert.equal(saved.entities[0].name, "Edited unrelated Entity name");
  assert.deepEqual(saved.extensions[lineageId], original.extensions[lineageId]);
});
