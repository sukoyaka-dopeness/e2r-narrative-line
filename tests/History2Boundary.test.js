import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  exportDatasetJson,
  importDatasetJson,
} from "../src/services/DatasetService.ts";
import { updateEvent } from "../src/services/EventService.ts";
import { classifyHistoryCapability } from "../src/services/HistoryCapabilityService.ts";
import {
  compareEventsByHistoryDate,
  formatEventTimelineDate,
} from "../src/services/HistoryService.ts";

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

function stableHistoryDataset() {
  return {
    version: "1.0",
    entities: [],
    events: [{
      id: "event-h1",
      extensions: { history: { time: { year: 1900, month: 5 } } },
    }],
    relations: [],
    extensions: { metadata: { datasetId: "dataset-h1" } },
  };
}

test("explicit circa upgrade creates one H2 position and synchronizes declarations", () => {
  const updated = updateEvent(stableHistoryDataset(), "event-h1", {
    history2Position: {
      position: { year: 1900, month: 5 },
      approximation: true,
    },
  });
  const history = updated.events[0].extensions.history;
  const assertion = history.assertions[0];
  const uses = updated.extensions["draft.github.sukoyaka-dopeness.specification"].uses;

  assert.deepEqual(history, {
    assertions: [{
      id: assertion.id,
      type: "position",
      position: { year: 1900, month: 5, approximation: "circa" },
    }],
  });
  assert.equal(assertion.id.length > 0, true);
  assert.equal("time" in history, false);
  assert.deepEqual(uses, [
    { extension: "metadata", version: "1.0.0" },
    { extension: "history", version: "2.0.0", features: ["approximation"] },
  ]);
});

test("ordinary exact H1 editing remains H1 without an H2 declaration", () => {
  const updated = updateEvent(stableHistoryDataset(), "event-h1", {
    historyDate: { year: 1901, month: 6 },
  });

  assert.deepEqual(updated.events[0].extensions.history, {
    time: { year: 1901, month: 6 },
  });
  assert.equal(updated.extensions["draft.github.sukoyaka-dopeness.specification"], undefined);
});

test("Dataset-wide upgrade converts all eligible H1 Core Object History payloads", () => {
  const dataset = {
    version: "1.0",
    entities: [{
      id: "entity-h1",
      extensions: { history: { time: { year: 1899, month: 2, day: 3 } } },
    }],
    events: [
      {
        id: "event-h1",
        extensions: {
          history: {
            time: {
              year: 1900,
              month: 5,
              day: 6,
              hour: 7,
              minute: 8,
              second: 9,
              timeZone: "Asia/Tokyo",
              offset: "+09:00",
              temporalOrder: 4,
            },
          },
        },
      },
      { id: "event-sibling", extensions: { history: { time: { year: 1901 } } } },
    ],
    relations: [{
      id: "relation-h1",
      sourceId: "event-h1",
      targetId: "entity-h1",
      extensions: { history: { time: { year: 1902 } } },
    }],
    extensions: { metadata: { datasetId: "dataset-h1" } },
  };

  const upgraded = updateEvent(dataset, "event-h1", {
    history2Position: {
      position: { year: 1900, month: 5, day: 6, hour: 7, minute: 8, second: 9 },
      approximation: true,
    },
  });

  for (const object of [
    ...upgraded.entities,
    ...upgraded.events,
    ...upgraded.relations,
  ]) {
    assert.ok(object.extensions.history.assertions[0].id.startsWith("history-position-"));
    assert.equal(object.extensions.history.time, undefined);
  }
  assert.deepEqual(upgraded.events[0].extensions.history.assertions[0], {
    id: "history-position-event-h1",
    type: "position",
    position: {
      year: 1900,
      month: 5,
      day: 6,
      hour: 7,
      minute: 8,
      second: 9,
      timeZone: "Asia/Tokyo",
      offset: "+09:00",
      approximation: "circa",
    },
    temporalOrder: 4,
  });
  assert.deepEqual(upgraded.extensions["draft.github.sukoyaka-dopeness.specification"].uses, [
    { extension: "metadata", version: "1.0.0" },
    { extension: "history", version: "2.0.0", features: ["approximation"] },
  ]);
  assert.equal(exportDatasetJson(upgraded).isValid, true);
  const roundTrip = importDatasetJson(exportDatasetJson(upgraded).json);
  assert.equal(roundTrip.isValid, true);
  assert.deepEqual(roundTrip.dataset, upgraded);
});

test("explicit circa upgrade refuses an invalid H1/H2 mixed Dataset without mutation", () => {
  const dataset = {
    ...stableHistoryDataset(),
    events: [
      ...stableHistoryDataset().events,
      { id: "event-h2", extensions: { history: { assertions: [{ id: "h2", type: "position", position: { year: 1899 } }] } } },
    ],
    extensions: {
      ...stableHistoryDataset().extensions,
      ["draft.github.sukoyaka-dopeness.specification"]: {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          { extension: "history", version: "2.0.0" },
        ],
      },
    },
  };
  const original = structuredClone(dataset);

  assert.throws(
    () => updateEvent(dataset, "event-h1", {
      history2Position: {
        position: { year: 1900, month: 5 },
        approximation: true,
      },
    }),
    /History 1 to History 2 upgrade refused/,
  );
  assert.deepEqual(dataset, original);
});

test("eligible undeclared legacy H1 upgrades only with a complete declaration", () => {
  const dataset = structuredClone(stableHistoryDataset());
  delete dataset.extensions;
  const upgraded = updateEvent(dataset, "event-h1", {
    history2Position: { position: { year: 1900, month: 5 }, approximation: true },
  });

  assert.equal(
    upgraded.extensions["draft.github.sukoyaka-dopeness.specification"].uses.find(
      (use) => use.extension === "history",
    ).version,
    "2.0.0",
  );
});

for (const [label, history] of [
  ["temporalOrder-only", { time: { temporalOrder: 1 } }],
  ["unknown member", { time: { year: 1900, future: true } }],
  ["legacy order", { time: { year: 1900, order: 1 } }],
]) {
  test(`refuses unsafe Dataset-wide upgrade: ${label}`, () => {
    const dataset = {
      ...stableHistoryDataset(),
      events: [{ id: "event-h1", extensions: { history } }],
    };
    const original = structuredClone(dataset);
    assert.throws(
      () => updateEvent(dataset, "event-h1", {
        history2Position: { position: { year: 1900 }, approximation: true },
      }),
      /History 1 to History 2 upgrade refused/,
    );
    assert.deepEqual(dataset, original);
  });
}

test("refuses Dataset-level History and preserves the source", () => {
  const dataset = {
    ...stableHistoryDataset(),
    extensions: {
      metadata: { datasetId: "dataset-h1" },
      history: { time: { year: 1900 } },
    },
  };
  const original = structuredClone(dataset);
  assert.throws(
    () => updateEvent(dataset, "event-h1", {
      history2Position: { position: { year: 1900 }, approximation: true },
    }),
    /History 1 to History 2 upgrade refused/,
  );
  assert.deepEqual(dataset, original);
});

test("turning circa off keeps the H2 assertion and removes only its Feature", () => {
  const upgraded = updateEvent(stableHistoryDataset(), "event-h1", {
    history2Position: {
      position: { year: 1900, month: 5 },
      approximation: true,
    },
  });
  const assertionId = upgraded.events[0].extensions.history.assertions[0].id;
  const exact = updateEvent(upgraded, "event-h1", {
    history2Position: {
      position: { year: 1900, month: 5 },
      approximation: false,
    },
  });

  assert.equal(exact.events[0].extensions.history.assertions[0].id, assertionId);
  assert.deepEqual(exact.events[0].extensions.history.assertions[0].position, {
    year: 1900,
    month: 5,
  });
  assert.deepEqual(
    exact.extensions["draft.github.sukoyaka-dopeness.specification"].uses,
    [
      { extension: "metadata", version: "1.0.0" },
      { extension: "history", version: "2.0.0" },
    ],
  );
});

test("removing the only H2 position cleans History and preserves unrelated declarations", () => {
  const upgraded = updateEvent(stableHistoryDataset(), "event-h1", {
    history2Position: {
      position: { year: 1900 },
      approximation: true,
    },
  });
  const removed = updateEvent(upgraded, "event-h1", {
    history2Position: { position: {}, approximation: false },
  });

  assert.equal(removed.events[0].extensions?.history, undefined);
  assert.deepEqual(removed.extensions.metadata, { datasetId: "dataset-h1" });
  assert.deepEqual(
    removed.extensions["draft.github.sukoyaka-dopeness.specification"].uses,
    [{ extension: "metadata", version: "1.0.0" }],
  );
});

test("approved Option A orders H2 approximate positions by recorded Civil Time", () => {
  const dataset = {
    version: "1.0",
    entities: [],
    events: [
      { id: "event-1901", extensions: { history: { assertions: [{ id: "a", type: "position", position: { year: 1901 } }] } } },
      { id: "event-circa-1900", extensions: { history: { assertions: [{ id: "b", type: "position", position: { year: 1900, approximation: "circa" } }] } } },
      { id: "event-1899", extensions: { history: { assertions: [{ id: "c", type: "position", position: { year: 1899 } }] } } },
    ],
    relations: [],
    extensions: {
      "draft.github.sukoyaka-dopeness.specification": {
        specVersion: "0.1.0",
        uses: [{ extension: "history", version: "2.0.0", features: ["approximation"] }],
      },
    },
  };
  const ordered = [...dataset.events].sort((left, right) =>
    compareEventsByHistoryDate(left, right, dataset),
  );

  assert.deepEqual(ordered.map((event) => event.id), [
    "event-1899",
    "event-circa-1900",
    "event-1901",
  ]);
  assert.equal(formatEventTimelineDate(dataset, dataset.events[1]), "1900");
});
