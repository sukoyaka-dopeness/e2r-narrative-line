import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";
import { importDatasetJson } from "../src/services/DatasetService.ts";
import { isKnownDimensionAssessmentNotice } from "../src/services/KnownSampleExtensionNotice.ts";

const id = "draft.github.sukoyaka-dopeness.dimension-assessment";
for (const locale of ["en", "ja"]) {
  test(`Cedar ${locale} has a bounded informational notice without changing diagnostics`, () => {
    const source = readFileSync(new URL(`../src/sample/cedar-observatory-showcase.${locale}.e2r.json`, import.meta.url), "utf8");
    const imported = importDatasetJson(source);
    assert.equal(imported.isValid, true);
    assert.equal(isKnownDimensionAssessmentNotice(imported.dataset, imported.issues), true);
    const copy = structuredClone(imported.dataset);
    copy.extensions[id].specVersion = "9.0.0";
    assert.equal(isKnownDimensionAssessmentNotice(copy, imported.issues), false);
    copy.extensions[id].specVersion = "0.2.0";
    copy.extensions["draft.github.sukoyaka-dopeness.specification"].uses.at(-1).version = "9.0.0";
    assert.equal(isKnownDimensionAssessmentNotice(copy, imported.issues), false);
    copy.extensions["draft.github.sukoyaka-dopeness.specification"].uses.at(-1).version = "0.2.0";
    copy.extensions[id].assessments[0].value = "invalid";
    assert.equal(isKnownDimensionAssessmentNotice(copy, imported.issues), false);
    const unknown = structuredClone(imported.dataset);
    unknown.extensions["example.unknown"] = unknown.extensions[id];
    delete unknown.extensions[id];
    assert.equal(isKnownDimensionAssessmentNotice(unknown, imported.issues), false);
    const undeclared = structuredClone(imported.dataset);
    undeclared.extensions["draft.github.sukoyaka-dopeness.specification"].uses.pop();
    assert.equal(isKnownDimensionAssessmentNotice(undeclared, imported.issues), false);
    assert.equal(isKnownDimensionAssessmentNotice(imported.dataset, [...imported.issues, { code: "other_warning", path: "/", severity: "warning" }]), false);
    assert.equal(isKnownDimensionAssessmentNotice(imported.dataset, [{ ...imported.issues[0], severity: "error" }, imported.issues[1]]), false);
  });
}

test("Current and Candidate notices keep EN/JA context and exact technical diagnostics behind a disclosure", async () => {
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  try {
    const { SampleExtensionNotice } = await server.ssrLoadModule("/src/components/ImportWarningPresentation.tsx");
    for (const locale of ["en", "ja"]) {
      const imported = importDatasetJson(readFileSync(new URL(`../src/sample/cedar-observatory-showcase.${locale}.e2r.json`, import.meta.url), "utf8"));
      for (const scope of ["current", "candidate"]) {
        const html = renderToStaticMarkup(React.createElement(SampleExtensionNotice, {
          dataset: imported.dataset, warnings: imported.issues, locale, scope,
        }));
        assert.match(html, /<details class="sample-extension-notice"><summary>/);
        assert.match(html, /unknown_extension/);
        assert.match(html, /specification_unavailable/);
        assert.match(html, /Severity|重要度/);
        assert.match(html, /Path:/);
        assert.match(html, locale === "ja" ? /追加情報/ : /Additional information/);
      }
    }
  } finally {
    await server.close();
  }
});

test("Cedar Candidate closed details remain reachable without focusing hidden descendants", async () => {
  const imported = importDatasetJson(readFileSync(new URL("../src/sample/cedar-observatory-showcase.ja.e2r.json", import.meta.url), "utf8"));
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.installGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  try {
    const [{ DatasetReplacementDialog }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/components/DatasetReplacementDialog.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => root.render(React.createElement(LanguageProvider, null,
      React.createElement(DatasetReplacementDialog, {
        datasetModified: true, pendingUserWork: false,
        candidateWarnings: imported.issues, candidateDataset: imported.dataset,
        busy: false, onCancel: () => {}, onDiscard: () => {},
        onExportAndContinue: () => {}, onExportDataset: () => {},
      }))));
    const summary = environment.document.querySelector(".sample-extension-notice > summary");
    const technical = environment.document.querySelector(".import-warning-details > summary");
    const buttons = [...environment.document.querySelectorAll(".dataset-replacement-actions button")];
    assert.ok(summary);
    assert.ok(technical);
    assert.equal(environment.document.activeElement, buttons[0]);
    const pressTab = async (shiftKey = false) => act(async () => {
      environment.document.dispatchEvent(new environment.window.KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, cancelable: true }));
    });
    summary.focus();
    await pressTab(true);
    assert.equal(environment.document.activeElement, buttons.at(-1));
    const outside = environment.document.createElement("button");
    environment.document.body.append(outside);
    outside.focus();
    await pressTab();
    assert.equal(environment.document.activeElement, summary);
    await act(async () => { summary.parentElement.open = true; });
    assert.equal(summary.parentElement.open, true);
    technical.focus();
    assert.equal(environment.document.activeElement, technical);
  } finally {
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
  }
});
