import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const relativeTimeId = "draft.github.sukoyaka-dopeness.relative-time";
const specificationId = "draft.github.sukoyaka-dopeness.specification";

function dataset(withRecord = false) {
  return {
    version: "1.0",
    entities: [],
    events: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
    relations: withRecord ? [{
      id: "rt1", sourceId: "a", targetId: "b",
      extensions: { [relativeTimeId]: { type: "relative-position", relation: "before" } },
    }] : [],
    extensions: {
      metadata: { datasetId: "progressive-disclosure-test" },
      ...(withRecord ? { [specificationId]: {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          { extension: relativeTimeId, version: "0.2.0", features: ["relative-position"] },
        ],
      } } : {}),
    },
  };
}

function button(document, label) {
  return [...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);
}

async function render(datasetValue, language = "en") {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.localStorage.setItem("narrativeline.language", language);
  environment.window.localStorage.setItem("narrativeline.lastDataset", JSON.stringify(datasetValue));
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
  } finally {
    await server.close();
  }
  return {
    ...environment,
    cleanup() { act(() => root.unmount()); environment.cleanup(); },
  };
}

test("OFF starts hidden; explicit More activation shares session visibility with Event Detail without Dataset preference", async () => {
  const rendered = await render(dataset(false));
  try {
    await act(async () => button(rendered.document, "Continue Editing").click());
    assert.equal(rendered.document.querySelector(".relative-time-timeline"), null);

    await act(async () => button(rendered.document, "More").click());
    await act(async () => button(rendered.document, "Show Relative Time tools").click());
    assert.ok(rendered.document.querySelector(".relative-time-timeline"));

    const card = [...rendered.document.querySelectorAll(".timeline-card")].find((item) => item.textContent?.includes("A"));
    await act(async () => card.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true })));
    await act(async () => button(rendered.document, "Edit").click());
    assert.ok(rendered.document.querySelector(".relative-time-authoring"));

    const stored = JSON.parse(rendered.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(JSON.stringify(stored).includes("relativeTimeUiEnabled"), false);
    assert.equal(stored.relations.length, 0);
  } finally {
    rendered.cleanup();
  }

  const reopened = await render(dataset(false));
  try {
    await act(async () => button(reopened.document, "Continue Editing").click());
    assert.equal(reopened.document.querySelector(".relative-time-timeline"), null);
  } finally {
    reopened.cleanup();
  }

  const japanese = await render(dataset(false), "ja");
  try {
    await act(async () => button(japanese.document, "編集を続ける").click());
    await act(async () => button(japanese.document, "その他").click());
    assert.ok(button(japanese.document, "相対時間の機能を表示"));
  } finally {
    japanese.cleanup();
  }
});

test("supported records derive ON on startup and unsupported declaration is diagnostic without enabling authoring", async () => {
  const supported = await render(dataset(true));
  try {
    await act(async () => button(supported.document, "Continue Editing").click());
    assert.ok(supported.document.querySelector(".relative-time-timeline"));
  } finally {
    supported.cleanup();
  }

  const diagnosticDataset = dataset(true);
  diagnosticDataset.extensions[specificationId].uses.find(({ extension }) => extension === relativeTimeId).version = "0.3.0";
  const diagnostic = await render(diagnosticDataset);
  try {
    await act(async () => button(diagnostic.document, "Continue Editing").click());
    assert.ok(diagnostic.document.querySelector(".relative-time-diagnostic-notice"));
    assert.equal(diagnostic.document.querySelector(".relative-time-authoring"), null);
    assert.ok(diagnostic.document.querySelector(".relative-time-timeline"));
  } finally {
    diagnostic.cleanup();
  }

  const malformedDataset = dataset(true);
  malformedDataset.entities.push({ id: "unsupported-endpoint", name: "Entity endpoint" });
  malformedDataset.relations[0].targetId = "unsupported-endpoint";
  const malformed = await render(malformedDataset);
  try {
    await act(async () => button(malformed.document, "Continue Editing").click());
    assert.ok(malformed.document.querySelector(".relative-time-diagnostic-notice"));
    assert.equal(malformed.document.querySelector(".relative-time-authoring"), null);
    assert.ok(malformed.document.querySelector(".relative-time-timeline"));
    const saved = JSON.parse(malformed.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(saved.relations[0].targetId, "unsupported-endpoint");
  } finally {
    malformed.cleanup();
  }
});
