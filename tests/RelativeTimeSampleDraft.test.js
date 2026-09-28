import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import {
  exportDatasetJson,
  importDatasetJson,
} from "../src/services/DatasetService.ts";
import {
  getEditableRelativeTimeAssertions,
  projectRelativeTimeForTimeline,
  supportsRelativeTimeAuthoring,
} from "../src/services/RelativeTimeService.ts";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const samplePath = (locale) =>
  new URL(`../../e2r-spec/docs/sample-drafts/relative-time-0.2.0-lantern-market.${locale}.e2r.json`, import.meta.url);
const perspectiveId = "draft.github.sukoyaka-dopeness.perspective";
const relativeTimeId = "draft.github.sukoyaka-dopeness.relative-time";
const specificationId = "draft.github.sukoyaka-dopeness.specification";

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

test("replacement-safety acceptance Dataset imports without extension diagnostics", async () => {
  const source = await readFile(new URL("./fixtures/dataset-replacement-safety-warning-free.e2r.json", import.meta.url), "utf8");
  const result = importDatasetJson(source);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(Object.keys(result.dataset.extensions ?? {}), []);
  assert.equal(result.dataset.events.length, 1);
});

test("English and Japanese Lantern Market drafts are supported, meaningful, and round-trip unchanged", async () => {
  const english = await readJson(samplePath("en"));
  const japanese = await readJson(samplePath("ja"));
  const englishImport = importDatasetJson(JSON.stringify(english));
  const japaneseImport = importDatasetJson(JSON.stringify(japanese));

  for (const result of [englishImport, japaneseImport]) {
    assert.equal(result.isValid, true);
    assert.deepEqual(result.issues, []);
    assert.equal(supportsRelativeTimeAuthoring(result.dataset), true);
    assert.deepEqual(result.dataset.extensions[specificationId].uses, [
      { extension: "metadata", version: "1.0.0" },
      { extension: relativeTimeId, version: "0.2.0", features: ["relative-position"] },
    ]);
    assert.equal(result.dataset.events.length, 4);
    assert.equal(result.dataset.relations.filter(({ extensions }) =>
      extensions?.["draft.github.sukoyaka-dopeness.relative-time"] !== undefined,
    ).length, 4);
    assert.equal(result.dataset.events.some(({ extensions, date }) =>
      extensions?.history !== undefined || date !== undefined,
    ), false);

    const projection = projectRelativeTimeForTimeline(result.dataset);
    assert.equal(projection.conflictedEventIds.length, 0);
    assert.equal(projection.groups.length, 1);
    assert.deepEqual(projection.groups[0].eventIdsByDisplayBand, [
      ["power-outage"],
      ["lanterns-lit", "circuit-isolated"],
      ["market-reopens"],
    ]);
    assert.deepEqual(projection.groups[0].incomparablePairs, [["lanterns-lit", "circuit-isolated"]]);
    assert.equal(getEditableRelativeTimeAssertions(result.dataset, "lanterns-lit").length, 2);

    const exported = exportDatasetJson(result.dataset);
    assert.equal(exported.isValid, true);
    assert.deepEqual(exported.issues, []);
    const exportedDataset = JSON.parse(exported.json);
    assert.deepEqual(exportedDataset, result.dataset);
    assert.equal(exportedDataset.extensions[perspectiveId], undefined);
    assert.equal(exportedDataset.events.some(({ extensions }) => extensions?.history !== undefined), false);
    const reimported = importDatasetJson(exported.json);
    assert.equal(reimported.isValid, true);
    assert.deepEqual(reimported.issues, []);
    assert.deepEqual(reimported.dataset, result.dataset);
  }

  assert.deepEqual(japanese.entities.map(({ id }) => id), english.entities.map(({ id }) => id));
  assert.deepEqual(japanese.events.map(({ id }) => id), english.events.map(({ id }) => id));
  assert.deepEqual(japanese.relations.map(({ id, sourceId, targetId }) => ({ id, sourceId, targetId })),
    english.relations.map(({ id, sourceId, targetId }) => ({ id, sourceId, targetId })));
});

test("NarrativeLine renders the sample's Relative Time bands, incomparable pair, and Event Detail assertions", async () => {
  const sample = await readJson(samplePath("en"));
  const imported = importDatasetJson(JSON.stringify(sample));
  assert.equal(imported.isValid, true);
  assert.deepEqual(imported.issues, []);

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
  const editedEventIds = [];
  const originalDataset = structuredClone(imported.dataset);
  try {
    const [timeline, authoring, language] = await Promise.all([
      server.ssrLoadModule("/src/components/RelativeTimeTimelineProjection.tsx"),
      server.ssrLoadModule("/src/components/RelativeTimeAuthoringPanel.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    const { RelativeTimeTimelineProjection } = timeline;
    const { RelativeTimeAuthoringPanel } = authoring;
    const { LanguageProvider } = language;
    await act(async () => root.render(React.createElement(
      LanguageProvider,
      null,
      React.createElement(React.Fragment, null,
        React.createElement(RelativeTimeTimelineProjection, {
          dataset: imported.dataset,
          onEditEvent: (eventId) => editedEventIds.push(eventId),
        }),
        React.createElement(RelativeTimeAuthoringPanel, {
          dataset: imported.dataset,
          eventId: "lanterns-lit",
          onOperation() {},
        }),
      ),
    )));

    const disclosure = environment.document.querySelector("details.relative-time-timeline");
    assert.ok(disclosure);
    disclosure.open = true;
    const bands = [...environment.document.querySelectorAll(".relative-time-display-band")];
    assert.deepEqual(bands.map((band) => [...band.querySelectorAll("li")].map((item) => item.textContent)), [
      ["The market loses power"],
      ["Stallholders light the lanterns", "Ren isolates the damaged circuit"],
      ["The market reopens in lantern light"],
    ]);
    assert.equal(environment.document.querySelectorAll(".relative-time-recorded-assertions > li").length, 4);
    const unordered = [...environment.document.querySelectorAll(".relative-time-recorded-relations details")]
      .find((details) => details.textContent.includes("Stallholders light the lanterns"));
    assert.ok(unordered);
    assert.match(unordered.textContent, /Ren isolates the damaged circuit/);

    const recorded = environment.document.querySelector(".relative-time-authoring__details--recorded");
    assert.ok(recorded);
    recorded.open = true;
    assert.match(recorded.textContent, /The market loses power/);
    assert.match(recorded.textContent, /The market reopens in lantern light/);
    const lanternButton = [...environment.document.querySelectorAll(".relative-time-display-band .relative-time-timeline__event")]
      .find((button) => button.textContent === "Stallholders light the lanterns");
    assert.ok(lanternButton);
    act(() => lanternButton.click());
    assert.deepEqual(editedEventIds, ["lanterns-lit"]);
    assert.deepEqual(imported.dataset, originalDataset);
  } finally {
    act(() => root.unmount());
    environment.cleanup();
    await server.close();
  }
});
