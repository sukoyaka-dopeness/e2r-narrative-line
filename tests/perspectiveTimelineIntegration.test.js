import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";
import { movePerspectiveEvent, PERSPECTIVE_EXTENSION_ID } from "../src/services/PerspectiveOrderingService.ts";
import { exportDatasetJson, importDatasetJson } from "../src/services/DatasetService.ts";
import { isDatasetModified, serializeDatasetBaseline } from "../src/services/DatasetBaselineService.ts";

const specificationId = "draft.github.sukoyaka-dopeness.specification";
const relativeTimeId = "draft.github.sukoyaka-dopeness.relative-time";

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

async function renderTimeline(initial, language = "en") {
  const environment = createDomTestEnvironment(`https://narrativeline.test/#locale=${language}`);
  environment.document.documentElement.lang = language;
  environment.window.localStorage.setItem("narrativeline.language", language);
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
  let setHarnessLanguage;
  try {
    const [{ TimelineScreen }, { LanguageProvider, useLanguage }] = await Promise.all([
      server.ssrLoadModule("/src/screens/TimelineScreen.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await server.close();
    const baseline = serializeDatasetBaseline(initial);
    function TimelineHarness({ dataset, selectedEvent, onSelectEvent, onMoveEvent }) {
      const language = useLanguage();
      setHarnessLanguage = language.setLanguage;
      return React.createElement(TimelineScreen, {
        dataset,
        datasetModified: isDatasetModified(dataset, baseline),
        selectedEvent,
        onSelectEvent,
        onEditEvent() {},
        onAddEvent() {},
        onMoveEvent,
        onImportDataset() { return { isValid: false, issues: [] }; },
        onExportDataset() { return exportDatasetJson(dataset); },
        onUpdateDatasetTitle() {},
      });
    }
    function Harness() {
      const [dataset, setDataset] = React.useState(initial);
      const [selectedEvent, setSelectedEvent] = React.useState(null);
      current = dataset;
      return React.createElement(LanguageProvider, null, React.createElement(TimelineHarness, {
        dataset,
        selectedEvent,
        onSelectEvent: setSelectedEvent,
        onMoveEvent(id, direction) {
          const result = movePerspectiveEvent(dataset, id, direction);
          if (result.ok) setDataset(result.dataset);
          return result;
        },
      }));
    }
    await act(async () => root.render(React.createElement(Harness)));
    return {
      container,
      environment,
      get dataset() { return current; },
      setLanguage(language) {
        act(() => setHarnessLanguage(language));
      },
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
    const move = rendered.container.querySelector('button[aria-label^="Move Third earlier in display order"]');
    assert.ok(move);
    assert.match(move.getAttribute("aria-label") ?? "", /unplaced, using derived display/);
    move.focus();
    assert.equal(rendered.environment.document.activeElement, move);
    await act(async () => move.click());
    assert.deepEqual(cardOrder(rendered.container), ["First", "Third", "Second"]);
    assert.match(rendered.environment.document.activeElement?.getAttribute("aria-label") ?? "",
      /^Move Third earlier in display order/);
    assert.equal(rendered.container.querySelector(".timeline-screen").dataset.datasetModified, "true");
    assert.equal(rendered.container.querySelector(".timeline-order-feedback")?.textContent,
      "Moved Third up in display order.");
    const orderHelp = rendered.container.querySelector(".timeline-order-actions__help");
    assert.ok(orderHelp);
    assert.equal(orderHelp.open, false);
    assert.equal(orderHelp.querySelector("summary")?.textContent, "About display order");
    assert.match(rendered.container.querySelector('button[aria-label^="Move Third earlier in display order"]')?.getAttribute("aria-label") ?? "", /placed$/);
    assert.deepEqual(rendered.dataset.extensions[PERSPECTIVE_EXTENSION_ID].perspectives["timeline-order"].eventOrder, ["c", "b"]);
    const repeatMove = rendered.container.querySelector('button[aria-label^="Move Third earlier in display order"]');
    assert.ok(repeatMove);
    await act(async () => repeatMove.click());
    assert.deepEqual(cardOrder(rendered.container), ["Third", "First", "Second"]);
    assert.deepEqual(rendered.dataset.extensions[PERSPECTIVE_EXTENSION_ID].perspectives["timeline-order"].eventOrder, ["c", "a", "b"]);
    assert.match(
      rendered.environment.document.activeElement?.getAttribute("aria-label") ?? "",
      /^Move Third later in display order/,
    );
    assert.equal(rendered.container.querySelector('button[aria-label^="Move Third earlier in display order"]')?.disabled, true);
    assert.equal(rendered.container.querySelector('button[aria-label^="Move Second later in display order"]')?.disabled, true);
    const exported = exportDatasetJson(rendered.dataset);
    assert.equal(exported.isValid, true);
    assert.deepEqual(importDatasetJson(exported.json).dataset, rendered.dataset);
  } finally {
    await rendered.cleanup();
  }
});

test("Timeline discloses ordering controls on focused or selected Events for keyboard and touch workflows", async () => {
  const rendered = await renderTimeline(fixture());
  try {
    const cards = [...rendered.container.querySelectorAll(".timeline-card")];
    assert.equal(cards.length, 3);
    assert.ok(cards.every((card) => card.tabIndex === 0));
    const target = cards[1];
    const orderActions = target.querySelector(".timeline-order-actions");
    assert.ok(orderActions);

    target.focus();
    await act(async () => target.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", {
      key: "Enter", bubbles: true,
    })));
    assert.equal(target.classList.contains("timeline-card--selected"), true);
    assert.equal(rendered.environment.document.activeElement, target);
    assert.equal(target.querySelectorAll(".timeline-order-actions button").length, 2);

    await act(async () => target.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", {
      key: " ", bubbles: true,
    })));
    assert.equal(rendered.environment.document.activeElement, target);
  } finally {
    await rendered.cleanup();
  }
});

test("ordering safety and Placed or Unplaced meaning are available in a collapsed contextual disclosure", async () => {
  const rendered = await renderTimeline(fixture());
  try {
    const target = rendered.container.querySelectorAll(".timeline-card")[1];
    target.focus();
    await act(async () => target.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", {
      key: "Enter", bubbles: true,
    })));
    const help = target.querySelector(".timeline-order-actions__help");
    assert.ok(help);
    assert.equal(help.open, false);
    assert.equal(help.querySelector("summary")?.textContent, "About display order");
    await act(async () => help.querySelector("summary")?.click());
    assert.match(help.textContent ?? "", /Changes display order only/);
    assert.match(help.textContent ?? "", /Unplaced · derived display means no position is saved/);
  } finally {
    await rendered.cleanup();
  }
});

test("Perspective mismatch details are available beside each affected Event and in a collapsed summary", async () => {
  const source = fixture();
  source.events = [
    { id: "a", name: "First", extensions: { history: { time: { year: 2020, temporalOrder: 1 } } } },
    { id: "b", name: "Second", extensions: { history: { time: { year: 2021, temporalOrder: 2 } } } },
  ];
  const moved = movePerspectiveEvent(source, "a", "later");
  assert.equal(moved.ok, true);

  const rendered = await renderTimeline(moved.dataset);
  try {
    const summary = rendered.container.querySelector(".timeline-order-diagnostics");
    assert.match(summary?.textContent ?? "", /One display order difference needs review/);
    assert.equal(summary?.querySelector(":scope > details")?.open, false);
    const localIndicators = [...rendered.container.querySelectorAll(".timeline-card__order-diagnostic")];
    assert.equal(localIndicators.length, 2);
    assert.ok(localIndicators.every((indicator) => indicator.open === false));
    assert.ok(localIndicators.every((indicator) => indicator.textContent?.includes("Review display order")));
    assert.ok(localIndicators.every((indicator) => !indicator.querySelector("summary span")));

    await act(async () => localIndicators[0].querySelector("summary")?.click());
    assert.equal(localIndicators[0].open, true);
    assert.match(localIndicators[0].textContent ?? "", /History chronology and display order/);
  } finally {
    await rendered.cleanup();
  }
});

test("Relative Time Derived mismatch is discoverable beside its affected Events", async () => {
  const source = fixture();
  source.events = [
    { id: "later", name: "Later" },
    { id: "same-band", name: "In the middle" },
    { id: "earlier", name: "Earlier" },
    { id: "standalone", name: "Standalone" },
  ];
  source.relations = [
    {
      id: "rel-1", sourceId: "earlier", targetId: "later",
      extensions: { [relativeTimeId]: { type: "relative-position", relation: "after" } },
    },
    {
      id: "rel-2", sourceId: "earlier", targetId: "same-band",
      extensions: { [relativeTimeId]: { type: "relative-position", relation: "after" } },
    },
  ];
  source.extensions[specificationId] = {
    specVersion: "0.1.0",
    uses: [
      { extension: "metadata", version: "1.0.0" },
      { extension: relativeTimeId, version: "0.2.0", features: ["relative-position"] },
    ],
  };
  const first = movePerspectiveEvent(source, "same-band", "earlier");
  const second = first.ok ? movePerspectiveEvent(first.dataset, "same-band", "earlier") : first;
  assert.equal(second.ok, true);

  const rendered = await renderTimeline(second.dataset);
  try {
    const indicators = [...rendered.container.querySelectorAll(".timeline-card__order-diagnostic")];
    assert.ok(indicators.length > 0);
    await act(async () => indicators[0].querySelector("summary")?.click());
    assert.match(indicators[0].textContent ?? "", /saved display order.*recorded Relative Time relationships/i);
    assert.doesNotMatch(indicators[0].textContent ?? "", /Derived band/);
  } finally {
    await rendered.cleanup();
  }

  const japanese = await renderTimeline(second.dataset, "ja");
  try {
    const indicator = japanese.container.querySelector(".timeline-card__order-diagnostic");
    await act(async () => indicator?.querySelector("summary")?.click());
    assert.match(indicator?.textContent ?? "", /保存された表示順は、記録された相対時間の前後関係から分かる順序と異なります/);
    assert.doesNotMatch(indicator?.textContent ?? "", /Derived band/);
  } finally {
    await japanese.cleanup();
  }
});

test("Japanese move feedback names the Event and display direction naturally", async () => {
  const rendered = await renderTimeline(fixture(), "ja");
  try {
    const move = rendered.container.querySelector('button[aria-label^="「Third」を表示順で上へ移動"]');
    await act(async () => move.click());
    const status = rendered.container.querySelector('[role="status"].timeline-order-feedback');
    assert.equal(status?.textContent, "「Third」を表示順で上へ移動しました。");
    assert.doesNotMatch(status?.textContent ?? "", /表示上上/);
  } finally {
    await rendered.cleanup();
  }
});

test("English move feedback remains English and preserves a Japanese Event name", async () => {
  const source = fixture();
  source.events[2].name = "再開 Announced";
  const rendered = await renderTimeline(source, "en");
  try {
    const move = rendered.container.querySelector('button[aria-label^="Move 再開 Announced earlier in display order"]');
    assert.ok(move);
    await act(async () => move.click());
    const status = rendered.container.querySelector('[role="status"].timeline-order-feedback');
    assert.equal(status?.textContent, "Moved 再開 Announced up in display order.");
  } finally {
    await rendered.cleanup();
  }
});

test("transient move feedback follows locale changes without changing its Event name", async () => {
  const rendered = await renderTimeline(fixture(), "en");
  try {
    const move = rendered.container.querySelector('button[aria-label^="Move Third earlier in display order"]');
    assert.ok(move);
    await act(async () => move.click());
    const status = rendered.container.querySelector('[role="status"].timeline-order-feedback');
    assert.equal(status?.textContent, "Moved Third up in display order.");

    rendered.setLanguage("ja");
    assert.equal(status?.textContent, "「Third」を表示順で上へ移動しました。");

    rendered.setLanguage("en");
    assert.equal(status?.textContent, "Moved Third up in display order.");
  } finally {
    await rendered.cleanup();
  }
});

test("production App file input imports Core and Lantern Market Datasets without warning information", async () => {
  const rendered = await renderApp(fixture());
  try {
    const continueEditing = [...rendered.container.querySelectorAll(".home-actions button")]
      .find((button) => button.textContent === "Continue Editing");
    assert.ok(continueEditing);
    await act(async () => continueEditing.click());

    const sources = [
      await readFile(new URL("./fixtures/dataset-replacement-safety-warning-free.e2r.json", import.meta.url), "utf8"),
      await readFile(new URL("../../e2r-spec/docs/sample-drafts/relative-time-0.2.0-lantern-market.en.e2r.json", import.meta.url), "utf8"),
      await readFile(new URL("../../e2r-spec/docs/sample-drafts/relative-time-0.2.0-lantern-market.ja.e2r.json", import.meta.url), "utf8"),
    ];
    for (const source of sources) {
      const input = rendered.container.querySelector('input[type="file"]');
      assert.ok(input);
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [{ text: async () => source }],
      });
      await act(async () => {
        input.dispatchEvent(new rendered.environment.window.Event("change", { bubbles: true }));
      });
      assert.equal(rendered.container.querySelector(".import-information"), null);
      assert.equal(rendered.container.querySelector("#timeline-import-errors-heading"), null);
      assert.equal(rendered.container.querySelector(".timeline-screen").dataset.datasetModified, "false");
    }
  } finally {
    rendered.cleanup();
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
    const move = rendered.container.querySelector('button[aria-label^="Move Third earlier in display order"]');
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

    const replacementSource = await readFile(
      new URL("./fixtures/dataset-replacement-safety-warning-free.e2r.json", import.meta.url),
      "utf8",
    );
    const selectReplacement = async () => {
      const input = rendered.container.querySelector('input[type="file"]');
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [{ text: async () => replacementSource }],
      });
      await act(async () => {
        input.dispatchEvent(new rendered.environment.window.Event("change", { bubbles: true }));
      });
    };

    await selectReplacement();
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    await act(async () => rendered.container.querySelector(".button-danger").click());
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    const replacement = JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.deepEqual(replacement, JSON.parse(replacementSource));
    assert.equal(replacement.extensions?.[PERSPECTIVE_EXTENSION_ID], undefined);
    assert.deepEqual(cardOrder(rendered.container), ["A Quiet Morning"]);
  } finally {
    rendered.cleanup();
  }
});
