import assert from "node:assert/strict";
import test from "node:test";
import {
  isDatasetModified,
  serializeDatasetBaseline,
} from "../src/services/DatasetBaselineService.ts";

function dataset() {
  return { version: "1.0", entities: [], events: [], relations: [] };
}

test("accepted Dataset content is clean and content edits are modified", () => {
  const accepted = dataset();
  const baseline = serializeDatasetBaseline(accepted);

  assert.equal(isDatasetModified(accepted, baseline), false);
  assert.equal(
    isDatasetModified(
      { ...accepted, extensions: { metadata: { title: "Test" } } },
      baseline,
    ),
    true,
  );
});

test("reverting Dataset content returns to a clean baseline", () => {
  const accepted = dataset();
  const baseline = serializeDatasetBaseline(accepted);
  const edited = { ...accepted, extensions: { metadata: { title: "Test" } } };

  assert.equal(isDatasetModified(edited, baseline), true);
  assert.equal(isDatasetModified(accepted, baseline), false);
});
