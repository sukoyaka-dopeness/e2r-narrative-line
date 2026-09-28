import assert from "node:assert/strict";
import test from "node:test";
import {
  getPerspectiveTimeline,
  movePerspectiveEvent,
  PERSPECTIVE_EXTENSION_ID,
  readPerspectiveAvailability,
} from "../src/services/PerspectiveOrderingService.ts";
import { addEvent, deleteEvent, updateEvent } from "../src/services/EventService.ts";
import { importDatasetJson, exportDatasetJson } from "../src/services/DatasetService.ts";
import { isDatasetModified, serializeDatasetBaseline } from "../src/services/DatasetBaselineService.ts";
import { projectRelativeTimeForTimeline } from "../src/services/RelativeTimeService.ts";

const specificationId = "draft.github.sukoyaka-dopeness.specification";
const relativeTimeId = "draft.github.sukoyaka-dopeness.relative-time";

function dataset(events = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
]) {
  return {
    version: "1.0",
    entities: [],
    events,
    relations: [],
    extensions: { metadata: { datasetId: "perspective-test" } },
  };
}

function withPerspective(source, perspectives, version = "0.1.0") {
  return {
    ...source,
    extensions: {
      ...source.extensions,
      [PERSPECTIVE_EXTENSION_ID]: { perspectives },
      [specificationId]: {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          { extension: PERSPECTIVE_EXTENSION_ID, version },
        ],
      },
    },
  };
}

const ids = (source) => getPerspectiveTimeline(source).events.map((event) => event.id);

test("a first move authors a sparse sequence, declares exact version, and round-trips as Dataset content", () => {
  const original = dataset();
  const baseline = serializeDatasetBaseline(original);
  assert.deepEqual(ids(original), ["a", "b", "c"]);
  assert.equal(isDatasetModified(original, baseline), false);

  const move = movePerspectiveEvent(original, "c", "earlier");
  assert.equal(move.ok, true);
  const authored = move.dataset;
  assert.deepEqual(ids(authored), ["a", "c", "b"]);
  assert.deepEqual(authored.extensions[PERSPECTIVE_EXTENSION_ID].perspectives["timeline-order"].eventOrder, ["c", "b"]);
  assert.deepEqual(authored.extensions[specificationId].uses, [
    { extension: "metadata", version: "1.0.0" },
    { extension: PERSPECTIVE_EXTENSION_ID, version: "0.1.0" },
  ]);
  assert.deepEqual(authored.events, original.events);
  assert.deepEqual(authored.relations, original.relations);
  assert.equal(isDatasetModified(authored, baseline), true);
  const exported = exportDatasetJson(authored);
  assert.equal(exported.isValid, true);
  const reimported = importDatasetJson(exported.json);
  assert.equal(reimported.isValid, true);
  assert.deepEqual(reimported.dataset, authored);
  assert.deepEqual(ids(reimported.dataset), ["a", "c", "b"]);
  assert.equal(isDatasetModified(reimported.dataset, serializeDatasetBaseline(reimported.dataset)), false);
});

test("adjacent keyboard moves place an undated Event between dated Events without changing temporal data", () => {
  const dated = dataset([
    { id: "d1", extensions: { history: { time: { year: 2020, month: 1, day: 1, temporalOrder: 1 } } } },
    { id: "d2", extensions: { history: { time: { year: 2021, month: 1, day: 1, temporalOrder: 2 } } } },
    { id: "d3", extensions: { history: { time: { year: 2022, month: 1, day: 1, temporalOrder: 3 } } } },
    { id: "u" },
  ]);
  const originalEvents = structuredClone(dated.events);
  const first = movePerspectiveEvent(dated, "u", "earlier");
  assert.equal(first.ok, true);
  const second = movePerspectiveEvent(first.dataset, "u", "earlier");
  assert.equal(second.ok, true);
  assert.deepEqual(ids(second.dataset), ["d1", "u", "d2", "d3"]);
  assert.deepEqual(second.dataset.events, originalEvents);
  assert.deepEqual(second.dataset.extensions[PERSPECTIVE_EXTENSION_ID].perspectives["timeline-order"].eventOrder, ["u", "d2", "d3"]);
  assert.equal(getPerspectiveTimeline(second.dataset).diagnostics.some((item) => item.kind === "history"), false);
  const chronologyConflict = movePerspectiveEvent(second.dataset, "d3", "earlier");
  assert.equal(chronologyConflict.ok, true);
  assert.ok(getPerspectiveTimeline(chronologyConflict.dataset).diagnostics.some((item) => item.kind === "history"));
});

test("Relative Time bands compose into ordinary Timeline order; a Human move retains a Derived mismatch", () => {
  const original = dataset([
    { id: "later" }, { id: "same-band" }, { id: "earlier" }, { id: "standalone" },
  ]);
  original.relations = [
    {
      id: "rel-1", sourceId: "earlier", targetId: "later",
      extensions: { [relativeTimeId]: { type: "relative-position", relation: "after" } },
    },
    {
      id: "rel-2", sourceId: "earlier", targetId: "same-band",
      extensions: { [relativeTimeId]: { type: "relative-position", relation: "after" } },
    },
  ];
  original.extensions[specificationId] = {
    specVersion: "0.1.0",
    uses: [
      { extension: "metadata", version: "1.0.0" },
      { extension: relativeTimeId, version: "0.2.0", features: ["relative-position"] },
    ],
  };
  const before = structuredClone(original);
  assert.deepEqual(ids(original), ["earlier", "later", "same-band", "standalone"]);
  const moved = movePerspectiveEvent(original, "same-band", "earlier");
  assert.equal(moved.ok, true);
  assert.deepEqual(ids(moved.dataset), ["earlier", "same-band", "later", "standalone"]);
  assert.deepEqual(moved.dataset.relations, before.relations);
  const acrossBand = movePerspectiveEvent(moved.dataset, "same-band", "earlier");
  assert.equal(acrossBand.ok, true);
  assert.deepEqual(ids(acrossBand.dataset), ["same-band", "earlier", "later", "standalone"]);
  assert.ok(getPerspectiveTimeline(acrossBand.dataset).diagnostics.some((item) => item.kind === "relative-band"));
  assert.deepEqual(acrossBand.dataset.relations, before.relations);
});

test("Relative Time Relation addition, edit, and deletion never rewrite authored Perspective order", () => {
  const authored = withPerspective(dataset(), {
    main: { name: "Main", eventOrder: ["c", "a"] },
  });
  authored.extensions[specificationId].uses.push({
    extension: relativeTimeId, version: "0.2.0", features: ["relative-position"],
  });
  authored.relations = [{
    id: "relative-a-b", sourceId: "a", targetId: "b",
    extensions: { [relativeTimeId]: { type: "relative-position", relation: "before" } },
  }];

  const originalEvents = structuredClone(authored.events);
  const originalPerspective = structuredClone(authored.extensions[PERSPECTIVE_EXTENSION_ID]);
  const added = structuredClone(authored);
  added.relations.push({
    id: "relative-b-c", sourceId: "b", targetId: "c",
    extensions: { [relativeTimeId]: { type: "relative-position", relation: "before" } },
  });
  const edited = structuredClone(added);
  edited.relations[0].extensions[relativeTimeId].relation = "after";
  const deleted = structuredClone(edited);
  deleted.relations = deleted.relations.filter(({ id }) => id !== "relative-a-b");

  for (const changed of [added, edited, deleted]) {
    assert.deepEqual(changed.extensions[PERSPECTIVE_EXTENSION_ID], originalPerspective);
    assert.deepEqual(changed.events, originalEvents);
    assert.deepEqual(getPerspectiveTimeline(changed).availability.entry.eventOrder, ["c", "a"]);
    assert.equal(exportDatasetJson(changed).isValid, true);
  }
});

test("single Perspective remains sparse; add and rename preserve placement; deletion cleans every entry", () => {
  const original = withPerspective(dataset(), {
    main: { name: "Main", eventOrder: ["b", "a"] },
  });
  assert.deepEqual(ids(original), ["b", "a", "c"]);
  assert.equal(getPerspectiveTimeline(original).placedIds.has("c"), false);
  const added = addEvent(original).dataset;
  assert.equal(getPerspectiveTimeline(added).placedIds.has(added.events.at(-1).id), false);
  const renamed = updateEvent(added, "b", { name: "Renamed" });
  assert.deepEqual(renamed.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.main.eventOrder, ["b", "a"]);
  const multi = withPerspective(renamed, {
    main: { name: "Main", eventOrder: ["b", "a"] },
    other: { name: "Other", eventOrder: ["c", "b"] },
  });
  const deleted = deleteEvent(multi, "b");
  assert.deepEqual(deleted.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.main.eventOrder, ["a"]);
  assert.deepEqual(deleted.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.other.eventOrder, ["c"]);
  assert.deepEqual(multi.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.main.eventOrder, ["b", "a"]);
});

test("imported dangling references survive read, move, export, and reload", () => {
  const original = withPerspective(dataset(), {
    main: { name: "Main", eventOrder: ["a", "missing", "b"] },
  });
  const imported = importDatasetJson(JSON.stringify(original));
  assert.equal(imported.isValid, true);
  assert.ok(getPerspectiveTimeline(imported.dataset).diagnostics.some((item) =>
    item.kind === "dangling" && item.eventIds[0] === "missing"));
  assert.deepEqual(imported.dataset, original);
  const moved = movePerspectiveEvent(imported.dataset, "b", "earlier");
  assert.equal(moved.ok, true);
  assert.ok(moved.dataset.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.main.eventOrder.includes("missing"));
  const exported = exportDatasetJson(moved.dataset);
  assert.equal(exported.isValid, true);
  assert.deepEqual(importDatasetJson(exported.json).dataset, moved.dataset);
  const deleted = deleteEvent(moved.dataset, "a");
  assert.ok(deleted.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.main.eventOrder.includes("missing"));
  assert.equal(deleted.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.main.eventOrder.includes("a"), false);
});

test("History edits retain authored order and recompute diagnostics without writing back", () => {
  const original = withPerspective(dataset([
    { id: "a", name: "A" }, { id: "b", name: "B" },
  ]), { main: { name: "Main", eventOrder: ["b", "a"] } });
  const beforeOrder = structuredClone(original.extensions[PERSPECTIVE_EXTENSION_ID]);
  const datedA = updateEvent(original, "a", { historyDate: { year: 2020, month: 1, day: 1 } });
  const datedB = updateEvent(datedA, "b", { historyDate: { year: 2021, month: 1, day: 1 } });
  assert.deepEqual(datedB.extensions[PERSPECTIVE_EXTENSION_ID], beforeOrder);
  assert.equal(exportDatasetJson(datedB).isValid, true);
  assert.ok(datedB.extensions[specificationId].uses.some((use) =>
    use.extension === "history" && use.version === "1.0.0"));
  assert.deepEqual(ids(datedB), ["b", "a"]);
  assert.ok(getPerspectiveTimeline(datedB).diagnostics.some((item) => item.kind === "history"));
  assert.equal(JSON.stringify(datedB.extensions[PERSPECTIVE_EXTENSION_ID]).includes("conflictAcknowledged"), false);
});

test("a cyclic Relative Time group leaves Perspective sequence and Recorded Relations intact", () => {
  const original = withPerspective(dataset(), {
    main: { name: "Main", eventOrder: ["b", "a"] },
  });
  original.relations = [
    { id: "r1", sourceId: "a", targetId: "b", extensions: { [relativeTimeId]: { type: "relative-position", relation: "after" } } },
    { id: "r2", sourceId: "b", targetId: "a", extensions: { [relativeTimeId]: { type: "relative-position", relation: "after" } } },
  ];
  original.extensions[specificationId].uses.push({
    extension: relativeTimeId, version: "0.2.0", features: ["relative-position"],
  });
  const before = structuredClone(original);
  assert.deepEqual(ids(original), ["b", "a", "c"]);
  assert.deepEqual(original, before);
  assert.deepEqual(projectRelativeTimeForTimeline(original).conflictedEventIds, [["a", "b"]]);
  assert.deepEqual(getPerspectiveTimeline(original).diagnostics.filter((item) => item.kind === "relative-band"), []);
});

test("deleting the final dated Event cleans Perspective references and keeps export valid", () => {
  const original = withPerspective(dataset([
    { id: "only", extensions: { history: { time: { year: 2020 } } } },
  ]), { main: { name: "Main", eventOrder: ["only"] } });
  original.extensions[specificationId].uses.push({ extension: "history", version: "1.0.0" });
  const deleted = deleteEvent(original, "only");
  assert.deepEqual(deleted.extensions[PERSPECTIVE_EXTENSION_ID].perspectives.main.eventOrder, []);
  assert.equal(exportDatasetJson(deleted).isValid, true);
});

test("multiple and unsupported Perspectives are preserved without implicit selection or authoring", () => {
  const multiple = withPerspective(dataset(), {
    main: { name: "Main", eventOrder: ["b", "a"] },
    alternate: { name: "Alternate", eventOrder: ["c", "a"] },
  });
  assert.equal(readPerspectiveAvailability(multiple).kind, "multiple");
  assert.equal(movePerspectiveEvent(multiple, "c", "earlier").ok, false);
  assert.deepEqual(ids(multiple), ["a", "b", "c"]);
  assert.deepEqual(importDatasetJson(exportDatasetJson(multiple).json).dataset, multiple);
  const unsupported = withPerspective(dataset(), {
    main: { name: "Main", eventOrder: ["b", "a"] },
  }, "0.2.0");
  assert.equal(readPerspectiveAvailability(unsupported).kind, "unsupported");
  assert.equal(movePerspectiveEvent(unsupported, "c", "earlier").ok, false);
  assert.throws(() => deleteEvent(unsupported, "a"), /unsupported Perspective/);
  assert.deepEqual(importDatasetJson(exportDatasetJson(unsupported).json).dataset, unsupported);
});
