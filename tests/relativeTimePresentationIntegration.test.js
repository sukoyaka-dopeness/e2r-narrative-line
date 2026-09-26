import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

function datasetWithUndatedEvents() {
  return {
    version: "1.0",
    entities: [],
    events: [{ id: "event-a", name: "First" }, { id: "event-b", name: "Second" }],
    relations: [],
    extensions: { metadata: { datasetId: "relative-time-ui" } },
  };
}

function datasetWithAssertions(relations) {
  const relativeTimeId = "draft.github.sukoyaka-dopeness.relative-time";
  return {
    version: "1.0",
    entities: [],
    events: [
      { id: "a", name: "First" },
      { id: "b", name: "Second" },
      { id: "c", name: "Third" },
    ],
    relations,
    extensions: {
      metadata: { datasetId: "relative-time-ui" },
      "draft.github.sukoyaka-dopeness.specification": {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          { extension: relativeTimeId, version: "0.2.0", features: ["relative-position"] },
        ],
      },
    },
  };
}

function relativePositionRelation(id, sourceId, targetId, relation) {
  return {
    id,
    sourceId,
    targetId,
    extensions: {
      "draft.github.sukoyaka-dopeness.relative-time": {
        type: "relative-position",
        relation,
      },
    },
  };
}

async function renderAuthoring(language, initialDataset = datasetWithUndatedEvents(), eventId = "event-a") {
  const environment = createDomTestEnvironment(`https://narrativeline.test/#locale=${language}`);
  environment.document.documentElement.lang = language;
  environment.window.localStorage.setItem("narrativeline.language", language);
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
    appType: "custom",
  });
  let currentDataset;
  try {
    const [component, context, service] = await Promise.all([
      server.ssrLoadModule("/src/components/RelativeTimeAuthoringPanel.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
      server.ssrLoadModule("/src/services/RelativeTimeService.ts"),
    ]);
    const { RelativeTimeAuthoringPanel } = component;
    const { LanguageProvider } = context;
    const { applyRelativeTimeOperation } = service;
    function Harness() {
      const [dataset, setDataset] = React.useState(initialDataset);
      currentDataset = dataset;
      return React.createElement(
        LanguageProvider,
        null,
        React.createElement(RelativeTimeAuthoringPanel, {
          dataset,
          eventId,
          onOperation: (operation) => setDataset((current) => {
            const result = applyRelativeTimeOperation(current, operation);
            return result.ok ? result.dataset : current;
          }),
        }),
      );
    }
    await act(async () => root.render(React.createElement(Harness)));
    return {
      ...environment,
      get dataset() { return currentDataset; },
      async cleanup() {
        act(() => root.unmount());
        environment.cleanup();
        await server.close();
      },
    };
  } catch (error) {
    await server.close();
    environment.cleanup();
    throw error;
  }
}

function setSelectValue(environment, select, value) {
  const setter = Object.getOwnPropertyDescriptor(
    environment.window.HTMLSelectElement.prototype,
    "value",
  )?.set;
  assert.ok(setter);
  act(() => {
    setter.call(select, value);
    select.dispatchEvent(new environment.window.Event("change", { bubbles: true }));
  });
}

test("English authoring creates a declared assertion and does not add inverse or Timeline date data", async () => {
  const rendered = await renderAuthoring("en");
  try {
    assert.match(rendered.document.body.textContent, /qualitative relation/);
    const selects = [...rendered.document.querySelectorAll("select")];
    setSelectValue(rendered, selects[0], "event-b");
    const add = [...rendered.document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Add new assertion",
    );
    assert.ok(add);
    act(() => add.click());
    assert.equal(rendered.dataset.relations.length, 1);
    assert.equal(rendered.dataset.relations[0].sourceId, "event-a");
    assert.equal(rendered.dataset.relations[0].targetId, "event-b");
    assert.deepEqual(rendered.dataset.events.map(({ extensions }) => extensions), [undefined, undefined]);
    const uses = rendered.dataset.extensions["draft.github.sukoyaka-dopeness.specification"].uses;
    assert.ok(uses.some(({ extension, version, features }) =>
      extension === "draft.github.sukoyaka-dopeness.relative-time" &&
      version === "0.2.0" && features.includes("relative-position"),
    ));
    assert.match(rendered.document.body.textContent, /Added a new assertion as a separate Relation/);
  } finally {
    await rendered.cleanup();
  }
});

test("Event Detail separates recorded Relation edits from new assertions and keeps identity on a direction change", async () => {
  const initial = datasetWithAssertions([
    relativePositionRelation("relation-ab", "a", "b", "after"),
    relativePositionRelation("relation-bc", "b", "c", "after"),
  ]);
  const rendered = await renderAuthoring("en", initial, "b");
  try {
    assert.match(rendered.document.body.textContent, /Recorded assertions/);
    assert.match(rendered.document.body.textContent, /Adding creates a separate Relation/);
    const rows = [...rendered.document.querySelectorAll("[data-relative-time-relation-id]")];
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((row) => row.getAttribute("data-relative-time-relation-id")), [
      "relation-ab",
      "relation-bc",
    ]);
    assert.match(rows[0].textContent, /Second is after First/);
    assert.match(rows[0].textContent, /Relation ID: relation-ab/);

    const direction = rendered.document.querySelector(
      'select[aria-label="Direction for Relation relation-ab"]',
    );
    assert.ok(direction);
    setSelectValue(rendered, direction, "before");
    const save = [...rendered.document.querySelectorAll("button")].find(
      (button) => button.getAttribute("aria-label") === "Save edit to Relation relation-ab",
    );
    assert.ok(save);
    act(() => save.click());

    assert.equal(rendered.dataset.relations.length, 2);
    assert.deepEqual(rendered.dataset.relations.map(({ id }) => id), ["relation-ab", "relation-bc"]);
    assert.equal(rendered.dataset.relations[0].sourceId, "a");
    assert.equal(rendered.dataset.relations[0].targetId, "b");
    assert.equal(
      rendered.dataset.relations[0].extensions["draft.github.sukoyaka-dopeness.relative-time"].relation,
      "before",
    );
    assert.equal(
      rendered.dataset.relations[1].extensions["draft.github.sukoyaka-dopeness.relative-time"].relation,
      "after",
    );
    assert.match(rendered.document.body.textContent, /Updated this assertion; its Relation ID is unchanged/);
    assert.match(rendered.document.body.textContent, /Second is before First/);
  } finally {
    await rendered.cleanup();
  }
});

test("separate imported assertions for one Event pair remain separately identified in Event Detail", async () => {
  const initial = datasetWithAssertions([
    relativePositionRelation("claim-forward", "a", "b", "after"),
    relativePositionRelation("claim-reverse", "b", "a", "after"),
  ]);
  const originalRelations = structuredClone(initial.relations);
  const rendered = await renderAuthoring("en", initial, "a");
  try {
    const rows = [...rendered.document.querySelectorAll("[data-relative-time-relation-id]")];
    assert.equal(rows.length, 2);
    assert.match(rows[0].textContent, /Relation ID: claim-forward/);
    assert.match(rows[1].textContent, /Relation ID: claim-reverse/);
    assert.deepEqual(rendered.dataset.relations, originalRelations);
  } finally {
    await rendered.cleanup();
  }
});

test("Japanese authoring localizes the first user-facing controls", async () => {
  const rendered = await renderAuthoring("ja");
  try {
    assert.match(rendered.document.body.textContent, /記録された主張/);
    assert.match(rendered.document.body.textContent, /新しい主張を追加/);
    assert.match(rendered.document.body.textContent, /相対時間/);
    assert.match(rendered.document.body.textContent, /相手のできごと/);
    assert.ok([...rendered.document.querySelectorAll("button")].some(
      (button) => button.textContent?.trim() === "相対時間を追加",
    ));
  } finally {
    await rendered.cleanup();
  }
});

test("Timeline projection exposes pairwise order and cycle fallback without rewriting Relations", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en");
  environment.document.documentElement.lang = "en";
  environment.window.localStorage.setItem("narrativeline.language", "en");
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
    appType: "custom",
  });
  const dataset = {
    version: "1.0",
    entities: [],
    events: [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }],
    relations: [
      { id: "ab", sourceId: "a", targetId: "b", extensions: { "draft.github.sukoyaka-dopeness.relative-time": { type: "relative-position", relation: "after" } } },
      { id: "bc", sourceId: "b", targetId: "c", extensions: { "draft.github.sukoyaka-dopeness.relative-time": { type: "relative-position", relation: "after" } } },
    ],
    extensions: {
      metadata: { datasetId: "projection-ui" },
      "draft.github.sukoyaka-dopeness.specification": {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          { extension: "draft.github.sukoyaka-dopeness.relative-time", version: "0.2.0", features: ["relative-position"] },
        ],
      },
    },
  };
  const originalRelations = structuredClone(dataset.relations);
  try {
    const [{ RelativeTimeTimelineProjection }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/components/RelativeTimeTimelineProjection.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => root.render(React.createElement(
      LanguageProvider,
      null,
      React.createElement(RelativeTimeTimelineProjection, { dataset, onEditEvent() {} }),
    )));
    assert.match(environment.document.body.textContent, /display bands are a presentation projection/i);
    assert.match(environment.document.body.textContent, /A/);
    assert.match(environment.document.body.textContent, /C/);
    assert.deepEqual(dataset.relations, originalRelations);
  } finally {
    act(() => root.unmount());
    environment.cleanup();
    await server.close();
  }
});
