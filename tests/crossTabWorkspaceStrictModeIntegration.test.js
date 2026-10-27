import assert from "node:assert/strict";
import test from "node:test";
import React, { StrictMode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const datasetUrl = "https://fixture.invalid/strict-mode-handoff.e2r.json";
const datasetSource = JSON.stringify({
  version: "1.0",
  entities: [{ id: "entity-handoff", name: "Handoff Entity" }],
  events: [{ id: "event-handoff", name: "Handoff Dataset" }],
  relations: [],
});

test("StrictMode effect replay leaves the active tab registered for a clean Handoff replacement", async () => {
  const environment = createDomTestEnvironment(
    `https://narrativeline.test/#locale=en&datasetUrl=${encodeURIComponent(datasetUrl)}`,
  );
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.localStorage.clear();

  const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: async (url) => {
      assert.equal(url, datasetUrl);
      return { ok: true, text: async () => datasetSource };
    },
  });

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

    await act(async () => {
      root.render(React.createElement(
        StrictMode,
        null,
        React.createElement(LanguageProvider, null, React.createElement(App)),
      ));
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    assert.equal(container.querySelector('[role="alert"]'), null);
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), datasetSource);
    assert.equal(container.textContent.includes("Handoff Dataset"), true);
    assert.equal(container.querySelector("h1")?.textContent, "Timeline");
  } finally {
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
    if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
    else delete globalThis.fetch;
  }
});

test("an untouched startup sample is not persisted or offered as a resumable workspace", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en");
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.localStorage.clear();
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false }, appType: "custom" });

  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    const homeActionButtons = () => [...container.querySelectorAll(".home-actions > button")];
    await act(async () => root.render(React.createElement(StrictMode, null, React.createElement(LanguageProvider, null, React.createElement(App)))));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));

    assert.equal(container.querySelector("h1")?.textContent, "Get Started");
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), null);
    assert.equal(homeActionButtons().length, 2, "Resume is absent on the untouched startup Home");
    assert.ok(container.querySelector(".home-actions > div button"), "the in-memory sample action is available");

    const languageButton = container.querySelector("header button");
    assert.ok(languageButton, "the Home language control exists for the rerender step");
    await act(async () => languageButton.click());
    assert.equal(environment.document.documentElement.lang, "ja", "language selection caused an actual app state update");
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), null);
    assert.equal(homeActionButtons().length, 2, "Resume stays absent after the state-driven rerender");

    const secondLanguageButton = container.querySelector("header button");
    assert.ok(secondLanguageButton, "the language control remains after rerender");
    await act(async () => secondLanguageButton.click());
    assert.equal(environment.document.documentElement.lang, "en");
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), null);
    assert.equal(homeActionButtons().length, 2);

    const sampleButton = container.querySelector(".home-actions > div button");
    assert.ok(sampleButton, "the explicit sample acquisition button exists");
    await act(async () => sampleButton.click());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(container.querySelector("h1")?.textContent, "Timeline", container.textContent);
    const saved = environment.window.localStorage.getItem("narrativeline.lastDataset");
    assert.ok(saved, "explicit sample acquisition persists the Dataset");
    assert.equal(JSON.parse(saved).events.length, 15);

    const homeNavigationButton = container.querySelector(".app-header--with-navigation-action button");
    assert.ok(homeNavigationButton, "Timeline exposes Home navigation");
    await act(async () => homeNavigationButton.click());
    assert.equal(homeActionButtons().length, 3, "the active session exposes Resume on Home");
    const resumeButton = homeActionButtons()[0];
    assert.ok(resumeButton, "the active session Resume control exists");
    await act(async () => resumeButton.click());
    assert.equal(container.querySelector("h1")?.textContent, "Timeline");
  } finally {
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
  }
});
test("a blocked clean-tab Handoff explains the peer conflict and can be retried after it clears", async () => {
  const environment = createDomTestEnvironment(
    `https://narrativeline.test/#locale=en&datasetUrl=${encodeURIComponent(datasetUrl)}`,
  );
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  const currentSource = JSON.stringify({
    version: "1.0",
    entities: [],
    events: [{ id: "event-current", name: "Current workspace" }],
    relations: [],
  });
  environment.window.localStorage.setItem("narrativeline.lastDataset", currentSource);
  environment.window.localStorage.setItem(
    "e2r:narrativeline:workspace-tab:peer-tab",
    JSON.stringify({ tabId: "peer-tab", active: true }),
  );
  let releasePeer;
  let resolvePeerAcquired;
  const peerHold = new Promise((resolve) => { releasePeer = resolve; });
  const peerAcquired = new Promise((resolve) => { resolvePeerAcquired = resolve; });
  void environment.window.navigator.locks.request(
    "e2r:narrativeline:workspace-tab:peer-tab",
    async () => {
      resolvePeerAcquired();
      await peerHold;
    },
  );
  await peerAcquired;

  const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: async (url) => {
      assert.equal(url, datasetUrl);
      return { ok: true, text: async () => datasetSource };
    },
  });

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

    await act(async () => {
      root.render(React.createElement(
        StrictMode,
        null,
        React.createElement(LanguageProvider, null, React.createElement(App)),
      ));
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    const replacementDialog = container.querySelector(".dataset-replacement-dialog");
    assert.ok(replacementDialog);
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), currentSource);
    await act(async () => replacementDialog.querySelector(".button-danger").click());
    const alert = container.querySelector('[role="alert"]');
    assert.match(alert?.textContent ?? "", /Another NarrativeLine tab has unapplied Dataset changes/);
    assert.equal(alert?.textContent.includes("current Dataset has changes that have not been exported"), false);
    const retryFeedback = container.querySelector(".dataset-replacement-dialog");
    const peerWorkWarning = container.querySelector(".cross-tab-work-warning");
    assert.ok(retryFeedback);
    assert.equal(peerWorkWarning, null);
    assert.ok(retryFeedback?.contains(alert));
    assert.equal(container.querySelectorAll('[role="alert"]').length, 1);
    assert.ok(container.querySelector('[role="alertdialog"]'));
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), currentSource);

    releasePeer();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    const retry = container.querySelector(".dataset-replacement-dialog .button-danger");
    assert.ok(retry);
    await act(async () => { retry.click(); });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), datasetSource);
    assert.equal(container.querySelector('[role="alert"]'), null);
    assert.equal(container.textContent.includes("Handoff Dataset"), true);
  } finally {
    releasePeer();
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
    if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
    else delete globalThis.fetch;
  }
});

test("canceling a peer-blocked Home replacement restores only the live peer-work warning", async () => {
  const environment = createDomTestEnvironment(
    `https://narrativeline.test/#locale=en&datasetUrl=${encodeURIComponent(datasetUrl)}`,
  );
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  const currentSource = JSON.stringify({ version: "1.0", entities: [], events: [{ id: "event-current", name: "Current workspace" }], relations: [] });
  const peerStatusKey = "e2r:narrativeline:workspace-tab:peer-tab";
  environment.window.localStorage.setItem("narrativeline.lastDataset", currentSource);
  environment.window.localStorage.setItem(
    peerStatusKey,
    JSON.stringify({ tabId: "peer-tab", active: true }),
  );
  let releasePeer;
  let resolvePeerAcquired;
  const peerHold = new Promise((resolve) => { releasePeer = resolve; });
  const peerAcquired = new Promise((resolve) => { resolvePeerAcquired = resolve; });
  void environment.window.navigator.locks.request(
    "e2r:narrativeline:workspace-tab:peer-tab",
    async () => { resolvePeerAcquired(); await peerHold; },
  );
  await peerAcquired;

  const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: async (url) => {
      assert.equal(url, datasetUrl);
      return { ok: true, text: async () => datasetSource };
    },
  });
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
    await act(async () => {
      root.render(React.createElement(
        StrictMode,
        null,
        React.createElement(LanguageProvider, null, React.createElement(App)),
      ));
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    const homeContent = container.querySelector(".home-screen-content");
    assert.ok(container.querySelector(".dataset-replacement-dialog"));
    await act(async () => container.querySelector(".dataset-replacement-dialog .button-danger").click());
    assert.equal(container.querySelector(".cross-tab-work-warning"), null);
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), currentSource);

    const cancel = container.querySelector(".dataset-replacement-dialog .replacement-cancel");
    assert.ok(cancel);
    await act(async () => { cancel.click(); });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    const peerWarning = container.querySelector(".cross-tab-work-warning");
    assert.ok(peerWarning, homeContent?.textContent);
    assert.ok(homeContent?.contains(peerWarning));
    assert.equal(container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(container.querySelectorAll('[role="alert"]').length, 0);
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), currentSource);

    releasePeer();
    environment.window.localStorage.setItem(peerStatusKey, JSON.stringify({ tabId: "peer-tab", active: false }));
    await act(async () => {
      environment.window.dispatchEvent(new environment.window.StorageEvent("storage", { key: peerStatusKey }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(container.querySelector(".cross-tab-work-warning"), null);

    const cedar = [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Open Cedar Observatory example");
    assert.ok(cedar);
    await act(async () => { cedar.click(); });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(container.querySelector("h1")?.textContent, "Timeline");
    assert.notEqual(environment.window.localStorage.getItem("narrativeline.lastDataset"), currentSource);
  } finally {
    releasePeer();
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
    if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
    else delete globalThis.fetch;
  }
});

test("an unapplied Dataset title draft marks the tab active without writing the Dataset", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.localStorage.clear();

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
    await act(async () => {
      root.render(React.createElement(
        StrictMode,
        null,
        React.createElement(LanguageProvider, null, React.createElement(App)),
      ));
    });

    const sampleButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Open Berlin Wall example");
    assert.ok(sampleButton);
    await act(async () => { sampleButton.click(); });

    const titleInput = container.querySelector('input[aria-label="Dataset title"]');
    assert.ok(titleInput);
    const originalTitle = titleInput.value;
    const originalDataset = environment.window.localStorage.getItem("narrativeline.lastDataset");
    const setInputValue = Object.getOwnPropertyDescriptor(
      environment.window.HTMLInputElement.prototype,
      "value",
    ).set;

    await act(async () => {
      setInputValue.call(titleInput, "Unapplied cross-tab title");
      titleInput.dispatchEvent(new environment.window.InputEvent("input", { bubbles: true, inputType: "insertText", data: "Unapplied cross-tab title" }));
      titleInput.dispatchEvent(new environment.window.Event("change", { bubbles: true }));
    });

    assert.equal(environment.document.documentElement.dataset.pendingUserWork, "true");
    const tabKey = Object.keys(environment.window.localStorage)
      .find((key) => key.startsWith("e2r:narrativeline:workspace-tab:"));
    assert.ok(tabKey);
    assert.equal(JSON.parse(environment.window.localStorage.getItem(tabKey)).active, true);
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), originalDataset);

    await act(async () => {
      setInputValue.call(titleInput, originalTitle);
      titleInput.dispatchEvent(new environment.window.InputEvent("input", { bubbles: true, inputType: "insertText", data: originalTitle }));
      titleInput.dispatchEvent(new environment.window.Event("change", { bubbles: true }));
    });
    assert.equal(environment.document.documentElement.dataset.pendingUserWork, "false");
    assert.equal(JSON.parse(environment.window.localStorage.getItem(tabKey)).active, false);
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), originalDataset);
  } finally {
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
  }
});
