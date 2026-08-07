import assert from "node:assert/strict";
import test from "node:test";
import {
  exportDatasetJson,
  getDatasetExportFilename,
  importDatasetJson,
  updateDatasetTitle,
} from "../src/services/DatasetService.ts";
import { deleteEntity } from "../src/services/EntityService.ts";
import {
  removeEventEntityRelations,
  updateEvent,
} from "../src/services/EventService.ts";
import { validateCoreDataset } from "../src/services/ValidationService.ts";

function validDataset() {
  return {
    version: "1.0",
    entities: [{ id: "entity-1" }],
    events: [{ id: "event-1" }],
    relations: [
      {
        id: "relation-1",
        sourceId: "event-1",
        targetId: "entity-1",
      },
    ],
  };
}

test("accepts a valid Core Dataset and preserves unknown data", () => {
  const dataset = {
    ...validDataset(),
    futureCoreField: { preserved: true },
    extensions: {
      "experimental.example": { retained: true },
    },
  };

  const result = validateCoreDataset(dataset);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.issues, [
    {
      code: "unknown_extension",
      path: "/extensions/experimental.example",
      severity: "warning",
    },
  ]);
  assert.equal(result.dataset, dataset);
});

test("reports missing required Dataset fields with JSON Pointer paths", () => {
  const result = validateCoreDataset({});

  assert.equal(result.isValid, false);
  assert.deepEqual(result.issues, [
    { code: "version_missing", path: "/version" },
    { code: "entities_missing", path: "/entities" },
    { code: "events_missing", path: "/events" },
    { code: "relations_missing", path: "/relations" },
  ]);
});

test("rejects non-array Core collections and invalid object identifiers", () => {
  const result = validateCoreDataset({
    version: "1.0",
    entities: [{ id: "   " }],
    events: {},
    relations: [],
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.issues, [
    { code: "events_invalid", path: "/events" },
    { code: "core_object_id_invalid", path: "/entities/0/id" },
  ]);
});

test("requires Core Object IDs to be unique across every Core collection", () => {
  const result = validateCoreDataset({
    version: "1.0",
    entities: [{ id: "same" }],
    events: [{ id: "same" }],
    relations: [],
  });

  assert.deepEqual(result.issues, [
    {
      code: "core_object_id_duplicate",
      path: "/events/0/id",
      relatedIds: ["same"],
    },
  ]);
});

test("rejects Relations that target a Relation or an unresolved Core Object", () => {
  const result = validateCoreDataset({
    version: "1.0",
    entities: [{ id: "entity-1" }],
    events: [],
    relations: [
      {
        id: "relation-1",
        sourceId: "relation-2",
        targetId: "missing",
      },
      {
        id: "relation-2",
        sourceId: "entity-1",
        targetId: "entity-1",
      },
    ],
  });

  assert.deepEqual(result.issues, [
    {
      code: "relation_source_is_relation",
      path: "/relations/0/sourceId",
      relatedIds: ["relation-2"],
    },
    {
      code: "relation_target_unresolved",
      path: "/relations/0/targetId",
      relatedIds: ["missing"],
    },
  ]);
});

test("reports a non-object document", () => {
  const result = validateCoreDataset([]);

  assert.deepEqual(result.issues, [{ code: "dataset_not_object", path: "" }]);
});

test("imports valid JSON without assigning a Dataset ID", () => {
  const result = importDatasetJson(JSON.stringify(validDataset()));

  assert.equal(result.isValid, true);
  assert.deepEqual(result.dataset, validDataset());
  assert.equal(result.dataset.extensions, undefined);
});

test("updates the optional Dataset title without discarding metadata", () => {
  const dataset = {
    ...validDataset(),
    extensions: { metadata: { datasetId: "dataset-1", source: "test" } },
  };

  const titled = updateDatasetTitle(dataset, "  My Dataset  ");
  assert.deepEqual(titled.extensions.metadata, {
    datasetId: "dataset-1",
    source: "test",
    title: "My Dataset",
  });

  const untitled = updateDatasetTitle(titled, " ");
  assert.deepEqual(untitled.extensions.metadata, {
    datasetId: "dataset-1",
    source: "test",
  });
});

test("uses a safe Dataset title for export filenames", () => {
  assert.equal(
    getDatasetExportFilename({
      ...validDataset(),
      extensions: { metadata: { title: "A: Dataset/Title?" } },
    }),
    "A- Dataset-Title.e2r.json",
  );
  assert.equal(getDatasetExportFilename(validDataset()), "e2r-dataset.e2r.json");
});

test("reports JSON syntax errors separately from Core validation errors", () => {
  const syntaxResult = importDatasetJson('{ "version": ');
  const structureResult = importDatasetJson("{}");

  assert.deepEqual(syntaxResult.issues, [
    { code: "json_parse_error", path: "" },
  ]);
  assert.deepEqual(structureResult.issues, [
    { code: "version_missing", path: "/version" },
    { code: "entities_missing", path: "/entities" },
    { code: "events_missing", path: "/events" },
    { code: "relations_missing", path: "/relations" },
  ]);
});

test("exports a valid Dataset without modifying it", () => {
  const dataset = validDataset();
  const result = exportDatasetJson(dataset);

  assert.equal(result.isValid, true);
  assert.deepEqual(JSON.parse(result.json), dataset);
  assert.deepEqual(dataset, validDataset());
});

test("does not export an invalid Dataset", () => {
  const result = exportDatasetJson({
    version: "1.0",
    entities: [{ id: "duplicate" }],
    events: [{ id: "duplicate" }],
    relations: [],
  });

  assert.equal(result.isValid, false);
  assert.equal(result.json, undefined);
  assert.deepEqual(result.issues, [
    {
      code: "core_object_id_duplicate",
      path: "/events/0/id",
      relatedIds: ["duplicate"],
    },
  ]);
});

test("reports values that cannot be serialized as JSON", () => {
  const result = exportDatasetJson({
    ...validDataset(),
    futureCoreField: BigInt(1),
  });

  assert.deepEqual(result.issues, [
    { code: "json_serialize_error", path: "" },
  ]);
});

test("removes only direct Relations between an Event and Entity", () => {
  const dataset = {
    version: "1.0",
    entities: [{ id: "entity-1" }, { id: "entity-2" }],
    events: [{ id: "event-1" }],
    relations: [
      { id: "relation-1", sourceId: "event-1", targetId: "entity-1" },
      { id: "relation-2", sourceId: "entity-1", targetId: "event-1" },
      {
        id: "relation-3",
        sourceId: "event-1",
        targetId: "entity-2",
        extensions: { "experimental.example": { retained: true } },
      },
    ],
  };

  const result = removeEventEntityRelations(dataset, "event-1", "entity-1");

  assert.deepEqual(result.relations, [dataset.relations[2]]);
  assert.deepEqual(result.entities, dataset.entities);
  assert.deepEqual(result.events, dataset.events);
});

test("deletes an Entity and every connected Relation", () => {
  const dataset = {
    version: "1.0",
    entities: [{ id: "entity-1" }, { id: "entity-2" }],
    events: [{ id: "event-1" }, { id: "event-2" }],
    relations: [
      { id: "relation-1", sourceId: "event-1", targetId: "entity-1" },
      { id: "relation-2", sourceId: "entity-1", targetId: "event-2" },
      { id: "relation-3", sourceId: "event-1", targetId: "entity-2" },
    ],
  };

  const result = deleteEntity(dataset, "entity-1");

  assert.deepEqual(result.entities, [dataset.entities[1]]);
  assert.deepEqual(result.events, dataset.events);
  assert.deepEqual(result.relations, [dataset.relations[2]]);
});

test("preserves omitted Event fields when no Event updates are supplied", () => {
  const dataset = validDataset();

  const result = updateEvent(dataset, "event-1", {});

  assert.deepEqual(result, dataset);
  assert.equal("description" in result.events[0], false);
});
