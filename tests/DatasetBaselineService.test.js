import assert from "node:assert/strict";
import test from "node:test";
import {
  isDatasetModified,
  serializeDatasetBaseline,
} from "../src/services/DatasetBaselineService.ts";
import {
  COORDINATE_EXTENSION_ID,
  LIAISONSCAPE_SPACE_ID,
  updateObjectCoordinate,
} from "../src/services/CoordinateService.ts";
import { exportDatasetJson } from "../src/services/DatasetService.ts";

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

test("Coordinate mutation is modified until content is reverted or exported", () => {
  const accepted = {
    version: "1.0",
    entities: [{
      id: "entity-1",
      extensions: {
        [COORDINATE_EXTENSION_ID]: {
          coordinates: [{ spaceId: LIAISONSCAPE_SPACE_ID, values: { x: 120, y: 180 } }],
        },
      },
    }],
    events: [],
    relations: [],
    extensions: {
      [COORDINATE_EXTENSION_ID]: {
        formatVersion: "0.1.0",
        spaces: [{
          id: LIAISONSCAPE_SPACE_ID,
          kind: "cartesian-2d",
          components: {
            x: { unit: "liaisonscape-user-unit", positiveDirection: "display-right" },
            y: { unit: "liaisonscape-user-unit", positiveDirection: "display-down" },
          },
        }],
      },
    },
  };
  const baseline = serializeDatasetBaseline(accepted);
  const updated = updateObjectCoordinate(accepted, "entity-1", LIAISONSCAPE_SPACE_ID, { x: 121 });

  assert.equal(updated.status, "updated");
  assert.equal(isDatasetModified(updated.dataset, baseline), true);
  const exported = exportDatasetJson(updated.dataset);
  assert.equal(exported.isValid, true);
  assert.equal(isDatasetModified(updated.dataset, serializeDatasetBaseline(updated.dataset)), false);

  const reverted = updateObjectCoordinate(updated.dataset, "entity-1", LIAISONSCAPE_SPACE_ID, { x: 120 });
  assert.equal(reverted.status, "updated");
  assert.equal(isDatasetModified(reverted.dataset, baseline), false);
});
