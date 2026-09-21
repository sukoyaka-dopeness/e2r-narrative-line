import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const unnamedDataset = JSON.stringify({
  version: "1.0",
  entities: [{ id: "entity-1" }],
  events: [{ id: "event-1" }],
  relations: [],
});

const coordinateDataset = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [{
    id: "event-1",
    extensions: {
      "experimental.github.sukoyaka-dopeness.coordinate": {
        coordinates: [{ spaceId: "graph-space", values: { x: 12, y: 34 } }],
      },
    },
  }],
  relations: [],
  extensions: {
    "experimental.github.sukoyaka-dopeness.coordinate": {
      formatVersion: "0.1.0",
      spaces: [{
        id: "graph-space",
        name: "Graph Space",
        kind: "cartesian-2d",
        components: {
          x: { unit: "px" },
          y: { unit: "px" },
        },
      }],
    },
  },
});

const editableCoordinateDataset = JSON.stringify({
  version: "1.0",
  entities: [{
    id: "entity-1",
    extensions: {
      "experimental.github.sukoyaka-dopeness.coordinate": {
        coordinates: [{ spaceId: "graph-space", values: { x: 12, y: 34 } }],
      },
    },
  }],
  events: [{ id: "event-1" }],
  relations: [{ id: "relation-1", sourceId: "event-1", targetId: "entity-1" }],
  extensions: coordinateDataset ? JSON.parse(coordinateDataset).extensions : {},
});

const editableCoordinatePayload = {
  formatVersion: "0.1.0",
  spaces: [{
    id: "liaisonscape-graph",
    name: "Graph Space",
    kind: "cartesian-2d",
    components: {
      x: { unit: "liaisonscape-user-unit", positiveDirection: "display-right" },
      y: { unit: "liaisonscape-user-unit", positiveDirection: "display-down" },
    },
  }],
};
const editableCoordinateDatasetWithSupportedSpace = JSON.stringify({
  ...JSON.parse(editableCoordinateDataset),
  entities: [{
    ...JSON.parse(editableCoordinateDataset).entities[0],
    extensions: {
      "experimental.github.sukoyaka-dopeness.coordinate": {
        coordinates: [{ spaceId: "liaisonscape-graph", values: { x: 12, y: 34 } }],
      },
    },
  }],
  extensions: { "experimental.github.sukoyaka-dopeness.coordinate": editableCoordinatePayload },
});

function containsJapanesePresentation(text) {
  return /[\u3040-\u30ff]/.test(text);
}

function findHeaderLocaleButton(document, expectedLabel) {
  return [...document.querySelectorAll("header button")]
    .find((button) => button.textContent?.trim() === expectedLabel);
}

async function renderApp({ hash = "", persistedLocale, storedDataset, fetcher } = {}) {
  const environment = createDomTestEnvironment(`https://narrativeline.test/${hash}`);
  environment.document.documentElement.lang = "en";
  environment.window.scrollTo = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  if (persistedLocale) environment.window.localStorage.setItem("narrativeline.language", persistedLocale);
  if (storedDataset) environment.window.localStorage.setItem("narrativeline.lastDataset", storedDataset);

  const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  if (fetcher) Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: fetcher });

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: "custom" });
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
    root,
    cleanup() {
      act(() => root.unmount());
      if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
      else delete globalThis.fetch;
      environment.cleanup();
    },
  };
}

test("sets the document language to the effective Japanese startup locale", async () => {
  const rendered = await renderApp({ persistedLocale: "ja" });
  try {
    assert.equal(rendered.document.documentElement.lang, "ja");
  } finally {
    rendered.cleanup();
  }
});

test("updates the document language through the explicit Header locale selector", async () => {
  const rendered = await renderApp({ persistedLocale: "en" });
  try {
    await act(async () => findHeaderLocaleButton(rendered.document, "日本語")?.click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "はじめる");
    assert.equal(rendered.document.documentElement.lang, "ja");
  } finally {
    rendered.cleanup();
  }
});

test("uses Japanese presentation for the startup Handoff loading status", async () => {
  const unresolvedFetch = () => new Promise(() => {});
  const rendered = await renderApp({
    hash: "#datasetUrl=https%3A%2F%2Ffixture.invalid%2Fdataset.json",
    persistedLocale: "ja",
    fetcher: unresolvedFetch,
  });
  try {
    const status = rendered.document.querySelector('[role="status"]');
    assert.ok(status);
    assert.equal(status.textContent.includes("Opening the handed-off Dataset"), false);
    assert.equal(containsJapanesePresentation(status.textContent), true);
  } finally {
    rendered.cleanup();
  }
});

test("renders the low-prominence GitHub Sponsors support link on Home", async () => {
  const rendered = await renderApp({ persistedLocale: "en" });
  try {
    const link = rendered.document.querySelector(".support-link");
    assert.ok(link);
    assert.equal(link.textContent, "Support E2R on GitHub Sponsors");
    assert.equal(link.getAttribute("href"), "https://github.com/sponsors/sukoyaka-dopeness");
    assert.equal(link.getAttribute("target"), "_blank");
    assert.equal(link.getAttribute("rel"), "noreferrer");
    assert.equal(rendered.document.querySelector(".app-footer")?.contains(link), false);

    const localeButton = findHeaderLocaleButton(rendered.document, "日本語");
    assert.ok(localeButton);
    await act(async () => localeButton.click());
    assert.equal(rendered.document.querySelector(".support-link")?.textContent, "GitHub SponsorsでE2Rを支援する");
  } finally {
    rendered.cleanup();
  }
});

test("uses Japanese presentation in the Credits dialog body", async () => {
  const rendered = await renderApp({ persistedLocale: "ja" });
  try {
    await act(async () => rendered.document.querySelector(".credits-button")?.click());
    const dialog = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(dialog);
    assert.equal(dialog.textContent.includes("Created by"), false);
    assert.equal(containsJapanesePresentation(dialog.textContent), true);
  } finally {
    rendered.cleanup();
  }
});

test("uses a Japanese aria-label for the Dataset title control", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: coordinateDataset });
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    const title = rendered.document.querySelector('input[aria-label]');
    assert.ok(title);
    assert.equal(containsJapanesePresentation(title.getAttribute("aria-label")), true);
  } finally {
    rendered.cleanup();
  }
});

test("uses Japanese presentation for the Timeline event count", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: unnamedDataset });
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    assert.equal(rendered.document.body.textContent.includes("1 events"), false);
    assert.equal(containsJapanesePresentation(rendered.document.body.textContent), true);
  } finally {
    rendered.cleanup();
  }
});

test("uses Japanese presentation for an unnamed Event fallback", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: unnamedDataset });
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    assert.equal(rendered.document.body.textContent.includes("(Unnamed Event)"), false);
  } finally {
    rendered.cleanup();
  }
});

test("uses Japanese presentation for a non-Handoff local-file error", async () => {
  const rendered = await renderApp({ persistedLocale: "ja" });
  try {
    const input = rendered.document.querySelector('input[type="file"]');
    assert.ok(input);
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [{ text: async () => { throw new Error("read failure"); } }],
    });
    await act(async () => input.dispatchEvent(new rendered.window.Event("change", { bubbles: true })));
    const alert = rendered.document.querySelector('[role="alert"]');
    assert.ok(alert);
    assert.equal(alert.textContent.includes("The selected file could not be read."), false);
    assert.equal(containsJapanesePresentation(alert.textContent), true);
  } finally {
    rendered.cleanup();
  }
});

test("localizes the production Dataset Replacement export failure", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: coordinateDataset });
  const originalStringify = JSON.stringify;
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    const timelineCard = rendered.document.querySelector(".timeline-card");
    assert.ok(timelineCard);
    await act(async () => timelineCard.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true })));
    const addEventButton = rendered.document.querySelector(".timeline-toolbar button");
    assert.ok(addEventButton);
    await act(async () => addEventButton.click());
    await act(async () => rendered.document.querySelector(".app-brand")?.click());
    const newDatasetButton = rendered.document.querySelector(".home-actions button:nth-child(2)");
    assert.ok(newDatasetButton);
    await act(async () => newDatasetButton.click());
    const replacementDialog = rendered.document.querySelector(".dataset-replacement-dialog");
    assert.ok(replacementDialog);
    const exportButton = replacementDialog.querySelector("button:last-child");
    assert.ok(exportButton);
    let failNextSerialization = true;
    JSON.stringify = (value, ...args) => {
      if (failNextSerialization && value?.events) {
        failNextSerialization = false;
        return undefined;
      }
      return originalStringify(value, ...args);
    };
    await act(async () => exportButton.click());
    const alert = rendered.document.querySelector('[role="alert"]');
    assert.ok(alert);
    assert.equal(alert.textContent.includes("The current Dataset could not be exported"), false);
    assert.equal(containsJapanesePresentation(alert.textContent), true);
    assert.equal(rendered.document.querySelector(".dataset-replacement-dialog") !== null, true);
  } finally {
    JSON.stringify = originalStringify;
    rendered.cleanup();
  }
});

test("localizes the CoordinatePanel Space label in production", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: coordinateDataset });
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    const timelineCard = rendered.document.querySelector(".timeline-card");
    assert.ok(timelineCard);
    await act(async () => timelineCard.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true })));
    const editButton = rendered.document.querySelector(".timeline-card button");
    assert.ok(editButton);
    await act(async () => editButton.click());
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    const label = rendered.document.querySelector(".coordinate-panel__space-name span");
    assert.ok(label);
    assert.equal(label.textContent, "スペース");
    assert.equal(rendered.document.querySelector(".coordinate-panel__space-name strong")?.textContent, "Graph Space");
  } finally {
    rendered.cleanup();
  }
});

test("localizes an unnamed Entity in the production Entity Picker", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: unnamedDataset });
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    const timelineCard = rendered.document.querySelector(".timeline-card");
    assert.ok(timelineCard);
    await act(async () => timelineCard.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true })));
    const editButton = rendered.document.querySelector(".timeline-card button");
    assert.ok(editButton);
    await act(async () => editButton.click());
    const saveAndAddButton = rendered.document.querySelector(".detail-primary-actions__primary button:nth-child(2)");
    assert.ok(saveAndAddButton);
    await act(async () => saveAndAddButton.click());
    const entityName = rendered.document.querySelector(".entity-picker-card__name");
    assert.ok(entityName);
    assert.equal(entityName.textContent, "（名前のないエンティティ）");
    assert.equal(entityName.textContent.includes("(Unnamed Entity)"), false);
    assert.equal(rendered.document.querySelector(".entity-picker-card")?.getAttribute("data-entity-id"), null);
  } finally {
    rendered.cleanup();
  }
});

test("re-presents the same production History validation error after a locale switch", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: unnamedDataset });
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    const timelineCard = rendered.document.querySelector(".timeline-card");
    assert.ok(timelineCard);
    await act(async () => timelineCard.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true })));
    const editButton = timelineCard.querySelector("button");
    assert.ok(editButton);
    await act(async () => editButton.click());

    const yearInput = rendered.document.querySelector(".date-fields input[type=number]");
    assert.ok(yearInput);
    const valueSetter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(valueSetter);
    await act(async () => {
      valueSetter.call(yearInput, "2024");
      yearInput.dispatchEvent(new rendered.window.Event("input", { bubbles: true }));
      yearInput.dispatchEvent(new rendered.window.Event("change", { bubbles: true }));
    });
    const monthInput = rendered.document.querySelectorAll(".date-fields input[type=number]")[1];
    assert.ok(monthInput);
    await act(async () => {
      valueSetter.call(monthInput, "13");
      monthInput.dispatchEvent(new rendered.window.Event("input", { bubbles: true }));
      monthInput.dispatchEvent(new rendered.window.Event("change", { bubbles: true }));
    });
    const alert = rendered.document.querySelector('[role="alert"]');
    assert.ok(alert);
    assert.equal(alert.textContent, "月は1から12の範囲で入力してください。");

    await act(async () => findHeaderLocaleButton(rendered.document, "English")?.click());
    const switchedAlert = rendered.document.querySelector('[role="alert"]');
    assert.ok(switchedAlert);
    assert.equal(switchedAlert.textContent, "Month must be between 1 and 12.");
    assert.equal(switchedAlert.textContent.includes("月は1から12の範囲で入力してください。"), false);
  } finally {
    rendered.cleanup();
  }
});

test("re-presents the same production Coordinate feedback after a locale switch", async () => {
  const rendered = await renderApp({ persistedLocale: "ja", storedDataset: editableCoordinateDatasetWithSupportedSpace });
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    const timelineCard = rendered.document.querySelector(".timeline-card");
    assert.ok(timelineCard);
    await act(async () => timelineCard.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true })));
    const editButton = timelineCard.querySelector("button");
    assert.ok(editButton);
    await act(async () => editButton.click());

    const relatedCard = rendered.document.querySelector(".related-card");
    assert.ok(relatedCard);
    await act(async () => relatedCard.click());
    const editEntityButton = rendered.document.querySelector(".related-card button");
    assert.ok(editEntityButton);
    await act(async () => editEntityButton.click());


    const coordinateActions = rendered.document.querySelector(".coordinate-panel__actions");
    assert.ok(coordinateActions);
    await act(async () => coordinateActions.querySelector("button")?.click());
    await act(async () => coordinateActions.querySelector("button:last-child")?.click());

    const status = rendered.document.querySelector('.coordinate-panel__notice[role="status"]');
    assert.ok(status);
    assert.equal(status.textContent, "座標は変更されていません。");

    const localeButton = findHeaderLocaleButton(rendered.document, "English");
    assert.ok(localeButton);
    await act(async () => localeButton.click());
    const switchedStatus = rendered.document.querySelector('.coordinate-panel__notice[role="status"]');
    assert.ok(switchedStatus);
    assert.equal(switchedStatus.textContent, "The Coordinate was unchanged.");
    assert.equal(switchedStatus.textContent.includes("座標は変更されていません。"), false);
  } finally {
    rendered.cleanup();
  }
});

test("round-trips the production locale toggle with an unknown fragment parameter", async () => {
  const rendered = await renderApp({ hash: "#locale=en&probe=keep-me" });
  try {
    const localeButton = findHeaderLocaleButton(rendered.document, "日本語");
    assert.ok(localeButton);
    const initialHistoryLength = rendered.window.history.length;

    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    assert.equal(rendered.document.documentElement.lang, "en");
    assert.equal(localeButton.textContent, "日本語");
    assert.equal(rendered.window.location.hash, "#locale=en&probe=keep-me");

    await act(async () => localeButton.click());
    assert.equal(rendered.window.location.hash, "#locale=ja&probe=keep-me");
    assert.equal(rendered.window.history.length, initialHistoryLength);
    assert.equal(rendered.document.documentElement.lang, "ja");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "はじめる");
    assert.equal(findHeaderLocaleButton(rendered.document, "English")?.textContent, "English");

    const englishLocaleButton = findHeaderLocaleButton(rendered.document, "English");
    assert.ok(englishLocaleButton);
    await act(async () => englishLocaleButton.click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    assert.equal(rendered.document.documentElement.lang, "en");
    assert.equal(findHeaderLocaleButton(rendered.document, "日本語")?.textContent, "日本語");
    assert.equal(rendered.window.location.hash, "#locale=en&probe=keep-me");
    assert.equal(rendered.window.history.length, initialHistoryLength);
  } finally {
    rendered.cleanup();
  }
});

test("dismisses the production Credits dialog when the backdrop is directly targeted", async () => {
  const rendered = await renderApp();
  try {
    const opener = rendered.document.querySelector(".credits-button");
    assert.ok(opener);
    opener.focus();
    await act(async () => opener.click());
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    const backdrop = rendered.document.querySelector(".modal-backdrop");
    assert.ok(backdrop);

    await act(async () => {
      backdrop.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    const dialogIsPresent = rendered.document.querySelector('[role="alertdialog"]') !== null;
    assert.equal(dialogIsPresent, false);
    assert.equal(rendered.document.activeElement, opener);
  } finally {
    rendered.cleanup();
  }
});
