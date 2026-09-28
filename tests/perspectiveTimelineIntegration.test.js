import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";
import { movePerspectiveEvent, PERSPECTIVE_EXTENSION_ID } from "../src/services/PerspectiveOrderingService.ts";
import { exportDatasetJson, importDatasetJson } from "../src/services/DatasetService.ts";
import { isDatasetModified, serializeDatasetBaseline } from "../src/services/DatasetBaselineService.ts";

const specificationId = "draft.github.sukoyaka-dopeness.specification";

function fixture() {
  return {
    version: "1.0",
    entities: [],
    events: [
      { id: "a", name: "First" },
      { id: "b", name: "Second" },
      { id: "c", name: "Third" },
    ],
    relations: [],
    extensions: { metadata: { datasetId: "perspective-ui" } },
  };
}

async function renderTimeline(initial) {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en");
  environment.document.documentElement.lang = "en";
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
    appType: "custom",
  });
  let current;
  try {
    const [{ TimelineScreen }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/screens/TimelineScreen.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await server.close();
    const baseline = serializeDatasetBaseline(initial);
    function Harness() {
      const [dataset, setDataset] = React.useState(initial);
      current = dataset;
      return React.createElement(LanguageProvider, null, React.createElement(TimelineScreen, {
        dataset,
        datasetModified: isDatasetModified(dataset, baseline),
        selectedEvent: null,
        onSelectEvent() {},
        onEditEvent() {},
        onAddEvent() {},
        onMoveEvent(id, direction) {
          const result = movePerspectiveEvent(dataset, id, direction);
          if (result.ok) setDataset(result.dataset);
          return result;
        },
        onImportDataset() { return { isValid: false, issues: [] }; },
        onExportDataset() { return exportDatasetJson(dataset); },
        onUpdateDatasetTitle() {},
      }));
    }
    await act(async () => root.render(React.createElement(Harness)));
    return {
      container,
      environment,
      get dataset() { return current; },
      cleanup() {
        act(() => root.unmount());
        environment.cleanup();
      },
    };
  } catch (error) {
    act(() => root.unmount());
    environment.cleanup();
    await server.close();
    throw error;
  }
}

function cardOrder(container) {
  return [...container.querySelectorAll(".timeline-card .timeline-event-name")]
    .map((element) => element.textContent);
}

async function renderApp(initial) {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = "en";
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", JSON.stringify(initial));
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.scrollTo = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
    appType: "custom",
  });
  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await server.close();
    await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
    return {
      container,
      environment,
      cleanup() {
        act(() => root.unmount());
        environment.cleanup();
      },
    };
  } catch (error) {
    act(() => root.unmount());
    environment.cleanup();
    await server.close();
    throw error;
  }
}

test("Timeline native move buttons are focusable and persist a sparse Dataset order", async () => {
  const rendered = await renderTimeline(fixture());
  try {
    assert.deepEqual(cardOrder(rendered.container), ["First", "Second", "Third"]);
    const move = rendered.container.querySelector('button[aria-label="Move Third earlier in display order"]');
    assert.ok(move);
    move.focus();
    assert.equal(rendered.environment.document.activeElement, move);
    await act(async () => move.click());
    assert.deepEqual(cardOrder(rendered.container), ["First", "Third", "Second"]);
    assert.equal(rendered.environment.document.activeElement?.getAttribute("aria-label"),
      "Move Third earlier in display order");
    assert.equal(rendered.container.querySelector(".timeline-screen").dataset.datasetModified, "true");
    assert.match(rendered.container.textContent, /Moved Third earlier in display order/);
    assert.deepEqual(rendered.dataset.extensions[PERSPECTIVE_EXTENSION_ID].perspectives["timeline-order"].eventOrder, ["c", "b"]);
    const exported = exportDatasetJson(rendered.dataset);
    assert.equal(exported.isValid, true);
    assert.deepEqual(importDatasetJson(exported.json).dataset, rendered.dataset);
  } finally {
    await rendered.cleanup();
  }
});

test("Timeline identifies unplaced Events and pauses authoring for multiple Perspectives", async () => {
  const initial = fixture();
  initial.extensions[PERSPECTIVE_EXTENSION_ID] = {
    perspectives: {
      first: { name: "First", eventOrder: ["b", "a"] },
      second: { name: "Second", eventOrder: ["c", "a"] },
    },
  };
  initial.extensions[specificationId] = {
    specVersion: "0.1.0",
    uses: [
      { extension: "metadata", version: "1.0.0" },
      { extension: PERSPECTIVE_EXTENSION_ID, version: "0.1.0" },
    ],
  };
  const rendered = await renderTimeline(initial);
  try {
    assert.deepEqual(cardOrder(rendered.container), ["First", "Second", "Third"]);
    assert.match(rendered.container.textContent, /Multiple Perspectives are present/);
    assert.equal(rendered.container.querySelector('button[aria-label^="Move Third"]'), null);
    assert.deepEqual(rendered.dataset, initial);
  } finally {
    await rendered.cleanup();
  }
});

test("production App treats a Perspective move as dirty Dataset content and guards replacement", async () => {
  const rendered = await renderApp(fixture());
  try {
    const continueEditing = [...rendered.container.querySelectorAll(".home-actions button")]
      .find((button) => button.textContent === "Continue Editing");
    assert.ok(continueEditing);
    await act(async () => continueEditing.click());
    const move = rendered.container.querySelector('button[aria-label="Move Third earlier in display order"]');
    assert.ok(move);
    await act(async () => move.click());
    assert.equal(rendered.container.querySelector(".timeline-screen").dataset.datasetModified, "true");
    assert.deepEqual(cardOrder(rendered.container), ["First", "Third", "Second"]);
    const persisted = JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.deepEqual(persisted.extensions[PERSPECTIVE_EXTENSION_ID].perspectives["timeline-order"].eventOrder, ["c", "b"]);

    await act(async () => rendered.container.querySelector(".app-brand").click());
    const create = [...rendered.container.querySelectorAll(".home-actions button")]
      .find((button) => button.textContent === "New Dataset");
    assert.ok(create);
    await act(async () => create.click());
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    await act(async () => rendered.container.querySelector(".replacement-cancel").click());
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.deepEqual(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")), persisted);
  } finally {
    rendered.cleanup();
  }
});
