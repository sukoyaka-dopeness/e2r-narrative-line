import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
import {
  compareEventsByHistoryDate,
  formatEventHistoryTime,
} from "../src/services/HistoryService.ts";
import {
  COORDINATE_EXTENSION_ID,
  LIAISONSCAPE_SPACE_ID,
  LEGACY_LINKSCAPE_SPACE_ID,
  readObjectCoordinates,
  updateObjectCoordinate,
} from "../src/services/CoordinateService.ts";
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

test("preserves the target-reference research fixture through a save round trip", async () => {
  const source = await readFile(
    new URL("../../e2r-spec/examples/research/target-reference/roundtrip-opaque-record.json", import.meta.url),
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

test("migrates the documented NarrativeLine Event date profile without changing the source", async () => {
  const source = await readFile(
    new URL("./fixtures/legacy/narrativeline-event-date-string-v1.e2r.json", import.meta.url),
    "utf8",
  );
  const original = JSON.parse(source);

  const result = importDatasetJson(source);

  assert.equal(result.isValid, true);
  assert.ok(result.dataset);
  assert.deepEqual(result.migration, {
    profile: "narrativeline.event-date-string.v1",
    originalSource: source,
  });
  assert.deepEqual(result.issues, [
    {
      code: "legacy_dataset_migrated",
      path: "",
      severity: "warning",
      profile: "narrativeline.event-date-string.v1",
    },
    {
      code: "extension_version_unspecified",
      path: "/extensions/metadata",
      severity: "warning",
    },
    {
      code: "extension_version_unspecified",
      path: "/events/0/extensions/history",
      severity: "warning",
    },
  ]);
  assert.deepEqual(result.dataset.events[0].extensions.history.time, {
    year: 1969,
    month: 7,
    day: 16,
  });
  assert.deepEqual(result.dataset.events[1].extensions.history.time, {
    year: 1969,
    month: 7,
    day: 20,
  });
  assert.equal("date" in result.dataset.events[0], false);
  assert.equal("date" in result.dataset.events[2], false);
  assert.equal(result.dataset.events[2].extensions, undefined);
  assert.equal(result.dataset.events[0].legacyNote, original.events[0].legacyNote);
  assert.equal(result.dataset.entities[0].legacyNote, original.entities[0].legacyNote);
  assert.equal(result.dataset.legacyNote, original.legacyNote);
  assert.equal(JSON.parse(source).events[0].date, "1969-07-16");

  const exported = exportDatasetJson(result.dataset);
  assert.equal(exported.isValid, true);
  assert.ok(exported.json);
  const current = JSON.parse(exported.json);
  assert.equal("date" in current.events[0], false);
  assert.deepEqual(current.events[0].extensions.history.time, {
    year: 1969,
    month: 7,
    day: 16,
  });
  assert.deepEqual(
    current.extensions["draft.github.sukoyaka-dopeness.specification"],
    {
      specVersion: "0.1.0",
      uses: [
        { extension: "metadata", version: "1.0.0" },
        { extension: "history", version: "1.0.0" },
      ],
    },
  );
  const reimported = importDatasetJson(exported.json);
  assert.equal(reimported.migration, undefined);
  assert.deepEqual(reimported.issues, []);
});

test("rejects invalid or conflicting legacy Event dates instead of guessing", () => {
  const invalidDate = importDatasetJson(JSON.stringify({
    ...validDataset(),
    events: [{ id: "event-1", date: "1969-02-30" }],
  }));
  assert.deepEqual(invalidDate.issues, [
    { code: "legacy_event_date_invalid", path: "/events/0/date" },
  ]);

  const conflictingDate = importDatasetJson(JSON.stringify({
    ...validDataset(),
    events: [{
      id: "event-1",
      date: "1969-07-20",
      extensions: { history: { time: { year: 1969 } } },
    }],
  }));
  assert.deepEqual(conflictingDate.issues, [
    { code: "legacy_event_date_history_conflict", path: "/events/0" },
  ]);
});

test("does not treat a partial unknown date field as the legacy profile", () => {
  const dataset = {
    ...validDataset(),
    events: [
      { id: "event-1", date: "application-owned-value" },
      { id: "event-2" },
    ],
  };

  const result = importDatasetJson(JSON.stringify(dataset));

  assert.equal(result.isValid, true);
  assert.deepEqual(result.dataset, dataset);
  assert.equal(result.migration, undefined);
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

test("adds complete exact Extension declarations to NarrativeLine output", () => {
  const dataset = {
    ...validDataset(),
    events: [{
      id: "event-1",
      extensions: { history: { time: { year: 2026, month: 8, day: 13 } } },
    }],
    extensions: { metadata: { datasetId: "dataset-1", title: "Example" } },
  };
  const original = structuredClone(dataset);

  const result = exportDatasetJson(dataset);

  assert.equal(result.isValid, true);
  assert.ok(result.json);
  const exported = JSON.parse(result.json);
  assert.deepEqual(
    exported.extensions["draft.github.sukoyaka-dopeness.specification"],
    {
      specVersion: "0.1.0",
      uses: [
        { extension: "metadata", version: "1.0.0" },
        { extension: "history", version: "1.0.0" },
      ],
    },
  );
  assert.deepEqual(importDatasetJson(result.json).issues, []);
  assert.deepEqual(dataset, original);
});

test("does not create an incomplete declaration for an unknown Extension", () => {
  const dataset = {
    ...validDataset(),
    extensions: {
      metadata: { title: "Preserve unknown Extension" },
      "vendor.example.unknown": { version: "vendor-owned" },
    },
  };

  const result = exportDatasetJson(dataset);

  assert.equal(result.isValid, true);
  assert.ok(result.json);
  assert.deepEqual(JSON.parse(result.json), dataset);
});

test("preserves an existing Specification Extension declaration", () => {
  const specificationId = "draft.github.sukoyaka-dopeness.specification";
  const dataset = {
    ...validDataset(),
    extensions: {
      metadata: { title: "Already declared" },
      [specificationId]: {
        specVersion: "0.1.0",
        uses: [{ extension: "metadata", version: "1.0.0" }],
        writerNote: "preserve this declaration",
      },
    },
  };

  const result = exportDatasetJson(dataset);

  assert.equal(result.isValid, true);
  assert.ok(result.json);
  assert.deepEqual(JSON.parse(result.json), dataset);
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

test("saves optional History time fields with contiguous precision", () => {
  const dataset = validDataset();
  const result = updateEvent(dataset, "event-1", {
    historyDate: {
      year: 2026,
      month: 8,
      day: 13,
      hour: 9,
      minute: 5,
      second: 7,
    },
  });

  assert.deepEqual(result.events[0].extensions.history.time, {
    year: 2026,
    month: 8,
    day: 13,
    hour: 9,
    minute: 5,
    second: 7,
  });
});

test("clearing History date precision also clears dependent time fields", () => {
  const dataset = {
    ...validDataset(),
    events: [{
      id: "event-1",
      extensions: {
        history: {
          time: {
            year: 2026,
            month: 8,
            day: 13,
            hour: 9,
            minute: 5,
            second: 7,
          },
        },
      },
    }],
  };

  const result = updateEvent(dataset, "event-1", {
    historyDate: { year: 2026, month: 8 },
  });

  assert.deepEqual(result.events[0].extensions.history.time, {
    year: 2026,
    month: 8,
  });
});

test("rejects out-of-range History time fields", () => {
  assert.throws(
    () => updateEvent(validDataset(), "event-1", {
      historyDate: {
        year: 2026,
        month: 8,
        day: 13,
        hour: 24,
      },
    }),
    /hour_out_of_range/,
  );
  assert.throws(
    () => updateEvent(validDataset(), "event-1", {
      historyDate: {
        year: 2026,
        month: 8,
        day: 13,
        hour: 9,
        minute: 60,
      },
    }),
    /minute_out_of_range/,
  );
});

test("orders Events with the same date by recorded time precision", () => {
  const earlier = {
    id: "event-earlier",
    extensions: { history: { time: { year: 2026, month: 8, day: 13, hour: 9 } } },
  };
  const later = {
    id: "event-later",
    extensions: { history: { time: { year: 2026, month: 8, day: 13, hour: 10 } } },
  };

  assert.equal(compareEventsByHistoryDate(earlier, later) < 0, true);
  assert.equal(compareEventsByHistoryDate(later, earlier) > 0, true);
});

test("formats only the recorded time precision and reveals seconds on focus", () => {
  const event = {
    id: "event-time",
    extensions: {
      history: { time: { year: 2026, month: 8, day: 13, hour: 9, minute: 5, second: 7 } },
    },
  };

  assert.equal(formatEventHistoryTime(event), "09:05");
  assert.equal(formatEventHistoryTime(event, true), "09:05:07");
  assert.equal(
    formatEventHistoryTime({
      id: "event-hour-only",
      extensions: { history: { time: { year: 2026, month: 8, day: 13, hour: 9 } } },
    }),
    "09",
  );
});

test("round-trips the Coordinate prototype unchanged while editing supported Event data", async () => {
  const coordinateId = COORDINATE_EXTENSION_ID;
  const specificationId = "draft.github.sukoyaka-dopeness.specification";
  const source = await readFile(
    new URL("../../e2r-spec/examples/cross-application-demo.json", import.meta.url),
    "utf8",
  );
  const imported = importDatasetJson(source);
  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);

  const originalDatasetCoordinate = structuredClone(imported.dataset.extensions[coordinateId]);
  const originalSpecification = structuredClone(imported.dataset.extensions[specificationId]);
  const originalEntityCoordinates = imported.dataset.entities.map((entity) => structuredClone(entity.extensions?.[coordinateId]));
  const originalEventCoordinates = imported.dataset.events.map((event) => structuredClone(event.extensions?.[coordinateId]));

  const edited = updateEvent(imported.dataset, "event-restoration-start", {
    description: "Restoration work started after the survey.",
  });
  const exported = exportDatasetJson(edited);
  assert.equal(exported.isValid, true);
  assert.ok(exported.json);

  const reimported = importDatasetJson(exported.json);
  assert.equal(reimported.isValid, true);
  assert.ok(reimported.dataset);
  assert.equal(reimported.dataset.events.find(({ id }) => id === "event-restoration-start")?.description, "Restoration work started after the survey.");
  assert.deepEqual(reimported.dataset.extensions[coordinateId], originalDatasetCoordinate);
  assert.deepEqual(reimported.dataset.extensions[specificationId], originalSpecification);
  assert.deepEqual(
    reimported.dataset.entities.map((entity) => entity.extensions?.[coordinateId]),
    originalEntityCoordinates,
  );
  assert.deepEqual(
    reimported.dataset.events.map((event) => event.extensions?.[coordinateId]),
    originalEventCoordinates,
  );
});

test("interprets Entity and partial Event coordinates from Dataset-defined Spaces", async () => {
  const source = await readFile(
    new URL("../../e2r-spec/examples/cross-application-demo.json", import.meta.url),
    "utf8",
  );
  const imported = importDatasetJson(source);
  assert.ok(imported.dataset);

  const entity = imported.dataset.entities.find(({ id }) => id === "entity-lighthouse");
  const event = imported.dataset.events.find(({ id }) => id === "event-restoration-start");
  assert.ok(entity);
  assert.ok(event);

  const entityResult = readObjectCoordinates(imported.dataset, entity);
  assert.equal(entityResult.status, "available");
  assert.deepEqual(entityResult.coordinates.map(({ spaceId }) => spaceId), [
    "liaisonscape-graph",
    "harbor-site-plan",
  ]);
  assert.deepEqual(entityResult.coordinates[0].values.map(({ id, value }) => ({ id, value })), [
    { id: "x", value: 80 },
    { id: "y", value: 156 },
  ]);
  assert.deepEqual(entityResult.coordinates[1].values.map(({ id, value, unit }) => ({ id, value, unit })), [
    { id: "east", value: 14.5, unit: "metre" },
    { id: "north", value: 82, unit: "metre" },
  ]);

  const eventResult = readObjectCoordinates(imported.dataset, event);
  assert.equal(eventResult.status, "available");
  assert.deepEqual(eventResult.coordinates[0].values.map(({ id, value }) => ({ id, value })), [
    { id: "y", value: 320 },
  ]);
  assert.deepEqual(eventResult.coordinates[0].missingComponents.map(({ id }) => id), ["x"]);
});

test("reads and bounded-writes the canonical LiaisonScape graph Space", () => {
  const dataset = validDataset();
  dataset.extensions = {
    [COORDINATE_EXTENSION_ID]: {
      formatVersion: "0.1.0",
      spaces: [{ id: LIAISONSCAPE_SPACE_ID, kind: "cartesian-2d", components: {
        x: { unit: "liaisonscape-user-unit", positiveDirection: "display-right" },
        y: { unit: "liaisonscape-user-unit", positiveDirection: "display-down" },
      } }],
    },
  };
  dataset.entities[0].extensions = { [COORDINATE_EXTENSION_ID]: { coordinates: [{ spaceId: LIAISONSCAPE_SPACE_ID, values: { x: 1, y: 2 }, note: "keep" }] } };
  const read = readObjectCoordinates(dataset, dataset.entities[0]);
  assert.equal(read.status, "available");
  const updated = updateObjectCoordinate(dataset, "entity-1", LIAISONSCAPE_SPACE_ID, { x: 3, y: 4 });
  assert.equal(updated.status, "updated");
  assert.equal(updated.dataset.entities[0].extensions[COORDINATE_EXTENSION_ID].coordinates[0].spaceId, LIAISONSCAPE_SPACE_ID);
  assert.equal(updated.dataset.entities[0].extensions[COORDINATE_EXTENSION_ID].coordinates[0].note, "keep");
  assert.notEqual(LEGACY_LINKSCAPE_SPACE_ID, LIAISONSCAPE_SPACE_ID);
});

test("does not claim interpretation for unsupported or inconsistent Coordinate payloads", () => {
  const object = {
    id: "entity-1",
    extensions: { [COORDINATE_EXTENSION_ID]: { coordinates: [
      { spaceId: "space-1", values: { x: 1 } },
    ] } },
  };
  const unsupported = {
    ...validDataset(),
    entities: [object],
    extensions: { [COORDINATE_EXTENSION_ID]: { formatVersion: "9.0.0", spaces: [] } },
  };
  assert.deepEqual(readObjectCoordinates(unsupported, object), {
    status: "unsupported",
    coordinates: [],
  });

  const inconsistent = {
    ...unsupported,
    extensions: { [COORDINATE_EXTENSION_ID]: {
      formatVersion: "0.1.0",
      spaces: [{ id: "space-1", components: { y: {} } }],
    } },
  };
  assert.deepEqual(readObjectCoordinates(inconsistent, object), {
    status: "invalid",
    coordinates: [],
  });
});

test("interprets and preserves an external-reference Coordinate fixture offline", async () => {
  const source = await readFile(
    new URL("../../e2r-spec/examples/coordinate/external-reference.json", import.meta.url),
    "utf8",
  );
  const imported = importDatasetJson(source);
  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);
  const entity = imported.dataset.entities[0];
  assert.ok(entity);

  const result = readObjectCoordinates(imported.dataset, entity);
  assert.equal(result.status, "available");
  assert.deepEqual(result.coordinates[0].values.map(({ id, value }) => ({ id, value })), [
    { id: "latitude", value: 35.6812 },
    { id: "longitude", value: 139.7671 },
  ]);

  const exported = exportDatasetJson(imported.dataset);
  assert.equal(exported.isValid, true);
  assert.deepEqual(JSON.parse(exported.json), JSON.parse(source));
});

test("declares Coordinate when it coexists with NarrativeLine-owned output", async () => {
  const source = await readFile(
    new URL("../../e2r-spec/examples/coordinate/external-reference.json", import.meta.url),
    "utf8",
  );
  const dataset = JSON.parse(source);
  dataset.extensions.metadata = { title: "Coordinate export" };

  const exported = exportDatasetJson(dataset);

  assert.equal(exported.isValid, true);
  assert.ok(exported.json);
  const result = JSON.parse(exported.json);
  assert.deepEqual(
    result.extensions["draft.github.sukoyaka-dopeness.specification"],
    {
      specVersion: "0.1.0",
      uses: [
        { extension: "metadata", version: "1.0.0" },
        {
          extension: "experimental.github.sukoyaka-dopeness.coordinate",
          version: "0.1.0",
        },
      ],
    },
  );
  assert.deepEqual(importDatasetJson(exported.json).issues, []);
});

test("updates an existing shared Coordinate while preserving other writer data", async () => {
  const source = await readFile(
    new URL("../../e2r-spec/examples/cross-application-demo.json", import.meta.url),
    "utf8",
  );
  const imported = importDatasetJson(source);
  assert.ok(imported.dataset);
  const dataset = structuredClone(imported.dataset);
  const entity = dataset.entities.find(({ id }) => id === "entity-lighthouse");
  assert.ok(entity);
  const payload = entity.extensions[COORDINATE_EXTENSION_ID];
  payload.writerNote = "preserve this payload field";
  payload.coordinates[0].routeHint = { source: "another-writer" };
  payload.coordinates[0].values.writerAxis = 7;
  dataset.extensions[COORDINATE_EXTENSION_ID].spaces[0].components.writerAxis = {
    unit: "another-writer-unit",
  };

  const originalDatasetCoordinate = structuredClone(
    dataset.extensions[COORDINATE_EXTENSION_ID],
  );
  const originalOtherCoordinate = structuredClone(payload.coordinates[1]);
  const result = updateObjectCoordinate(
    dataset,
    "entity-lighthouse",
    "liaisonscape-graph",
    { x: 96 },
  );

  assert.equal(result.status, "updated");
  assert.notEqual(result.dataset, dataset);
  const updatedEntity = result.dataset.entities.find(
    ({ id }) => id === "entity-lighthouse",
  );
  assert.deepEqual(
    updatedEntity.extensions[COORDINATE_EXTENSION_ID].coordinates[0],
    {
      spaceId: "liaisonscape-graph",
      values: { x: 96, y: 156, writerAxis: 7 },
      routeHint: { source: "another-writer" },
    },
  );
  assert.equal(
    updatedEntity.extensions[COORDINATE_EXTENSION_ID].writerNote,
    "preserve this payload field",
  );
  assert.deepEqual(
    updatedEntity.extensions[COORDINATE_EXTENSION_ID].coordinates[1],
    originalOtherCoordinate,
  );
  assert.deepEqual(
    result.dataset.extensions[COORDINATE_EXTENSION_ID],
    originalDatasetCoordinate,
  );
});

test("refuses unsafe Coordinate writes without changing the Dataset", () => {
  const coordinateId = COORDINATE_EXTENSION_ID;
  const object = {
    id: "entity-1",
    extensions: {
      [coordinateId]: {
        coordinates: [{ spaceId: "space-1", values: { x: 4 } }],
      },
    },
  };
  const dataset = {
    ...validDataset(),
    entities: [object],
    extensions: {
      [coordinateId]: {
        formatVersion: "0.1.0",
        spaces: [{
          id: "space-1",
          components: { x: { minimum: 0, maximum: 10 } },
        }],
      },
    },
  };

  for (const [spaceId, values] of [
    ["space-1", { y: 2 }],
    ["space-1", { x: 11 }],
    ["missing-space", { x: 2 }],
  ]) {
    const result = updateObjectCoordinate(dataset, "entity-1", spaceId, values);
    assert.notEqual(result.status, "updated");
    assert.equal(result.dataset, dataset);
  }

  const unsupported = structuredClone(dataset);
  unsupported.extensions[coordinateId].formatVersion = "9.0.0";
  const unsupportedResult = updateObjectCoordinate(
    unsupported,
    "entity-1",
    "space-1",
    { x: 5 },
  );
  assert.equal(unsupportedResult.status, "unsupported");
  assert.equal(unsupportedResult.dataset, unsupported);

  const eventResult = updateObjectCoordinate(
    dataset,
    "event-1",
    "space-1",
    { x: 5 },
  );
  assert.equal(eventResult.status, "unsupported");
  assert.equal(eventResult.dataset, dataset);
});
