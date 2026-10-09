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

    const alert = container.querySelector('[role="alert"]');
    assert.match(alert?.textContent ?? "", /Another NarrativeLine tab has unapplied Dataset changes/);
    assert.equal(alert?.textContent.includes("current Dataset has changes that have not been exported"), false);
    assert.equal(container.querySelector('[role="dialog"]'), null);
    assert.equal(container.textContent.includes("Retry replacement"), true);
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), currentSource);

    releasePeer();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    const retry = [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Retry replacement");
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
