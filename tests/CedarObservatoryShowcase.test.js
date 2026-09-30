import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { importDatasetJson, exportDatasetJson } from "../src/services/DatasetService.ts";
import { getQuantitativeTimeCandidates } from "../src/services/QuantitativeTimeCandidateService.ts";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const source = (locale) => readFileSync(
  new URL(`../src/sample/cedar-observatory-showcase.${locale}.e2r.json`, import.meta.url),
  "utf8",
);

const summarize = (dataset) => ({
  entities: dataset.entities.map(({ id }) => id),
  events: dataset.events.map(({ id, extensions }) => ({ id, time: extensions?.history?.time })),
  relations: dataset.relations.map(({ id, sourceId, targetId, extensions }) => ({
    id,
    sourceId,
    targetId,
    relativeTime: extensions?.["draft.github.sukoyaka-dopeness.relative-time"],
  })),
});

test("showcase EN/JA have the same graph and import/export without diagnostics", () => {
  const datasets = ["en", "ja"].map((locale) => {
    const imported = importDatasetJson(source(locale));
    assert.equal(imported.isValid, true, JSON.stringify(imported.issues));
    assert.deepEqual(imported.issues, []);
    const exported = exportDatasetJson(imported.dataset);
    assert.equal(exported.isValid, true, JSON.stringify(exported.issues));
    const reopened = importDatasetJson(exported.json);
    assert.equal(reopened.isValid, true, JSON.stringify(reopened.issues));
    assert.deepEqual(reopened.issues, []);
    assert.deepEqual(reopened.dataset, imported.dataset);
    return imported.dataset;
  });
  assert.deepEqual(summarize(datasets[0]), summarize(datasets[1]));
  assert.equal(datasets[0].entities.length, 6);
  assert.equal(datasets[0].events.length, 12);
  assert.equal(datasets[0].relations.length, 28);
  assert.equal(datasets[0].events.filter(({ extensions }) => extensions?.history?.time).length, 8);
  assert.deepEqual(datasets[0].events.filter(({ extensions }) => !extensions?.history?.time).map(({ id }) => id),
    ["invitations-sent", "dome-ready", "telescope-checked", "sky-tour"]);
  assert.equal(datasets[0].relations.filter(({ sourceId, targetId }) =>
    datasets[0].entities.some(({ id }) => id === sourceId) &&
    datasets[0].entities.some(({ id }) => id === targetId)).length, 6);
});

test("showcase keeps recorded History separate from direct calendar and elapsed candidates", () => {
  for (const locale of ["en", "ja"]) {
    const imported = importDatasetJson(source(locale));
    const dataset = imported.dataset;
    assert.deepEqual(getQuantitativeTimeCandidates(dataset, "invitations-sent")
      .map(({ relationId, date }) => ({ relationId, date })), [
      { relationId: "invitations-next-month", date: { year: 2026, month: 6 } },
    ]);
    assert.deepEqual(getQuantitativeTimeCandidates(dataset, "sky-tour")
      .map(({ relationId, date }) => ({ relationId, date })), [
      { relationId: "tour-two-hours-after-opening", date: { year: 2026, month: 6, day: 20, hour: 20, minute: 0 } },
    ]);
    assert.equal(dataset.events.find(({ id }) => id === "invitations-sent").extensions, undefined);
    assert.equal(dataset.events.find(({ id }) => id === "sky-tour").extensions, undefined);
    assert.equal(dataset.relations.filter(({ extensions }) =>
      extensions?.["draft.github.sukoyaka-dopeness.relative-time"]?.type === "relative-position").length, 2);
    assert.deepEqual(dataset.extensions["draft.github.sukoyaka-dopeness.specification"].uses.at(-1).features,
      ["relative-position", "calendar-granule-relation", "elapsed-offset"]);
  }
});

test("Home opens the separate showcase through the existing Dataset replacement path", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.localStorage.setItem("narrativeline.language", "en");
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
    const buttons = [...environment.document.querySelectorAll("button")];
    assert.ok(buttons.some(({ textContent }) => textContent.trim() === "Open Berlin Wall example"));
    const showcaseButton = buttons.find(({ textContent }) => textContent.trim() === "Open Cedar Observatory example");
    assert.ok(showcaseButton);
    await act(async () => showcaseButton.click());
    assert.equal(environment.document.querySelectorAll(".timeline-card").length, 12);
    assert.equal(environment.document.querySelector('input[aria-label="Dataset title"]')?.value,
      "Cedar Observatory: An Open Night");
    assert.ok(environment.document.body.textContent.includes("date/time candidate"));
    assert.ok(environment.document.querySelector(".relative-time-timeline"));
  } finally {
    await server.close();
    await act(async () => root.unmount());
    environment.cleanup();
  }
});

test("Home names both built-in samples in Japanese", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.localStorage.setItem("narrativeline.language", "ja");
  environment.window.scrollTo = () => {};
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
    const labels = [...environment.document.querySelectorAll("button")].map(({ textContent }) => textContent.trim());
    assert.ok(labels.includes("ベルリンの壁の例を開く"));
    assert.ok(labels.includes("シダー天文台の例を開く"));
  } finally {
    await server.close();
    await act(async () => root.unmount());
    environment.cleanup();
  }
});
