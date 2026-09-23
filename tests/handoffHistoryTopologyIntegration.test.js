import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const handoffUrl = "https://fixture.invalid/history-topology.e2r.json";
const handoffHash = `#datasetUrl=${encodeURIComponent(handoffUrl)}&locale=ja&foo=a%2Fb`;
const handoffDataset = JSON.stringify({
  version: "1.0",
  entities: [{ id: "entity-1" }],
  events: [{ id: "event-1" }],
  relations: [{ id: "relation-1", sourceId: "event-1", targetId: "entity-1" }],
});

function relevantHistoryCall(call) {
  return call.state?.narrativeLineView?.currentScreen === "home"
    || call.state?.narrativeLineView?.currentScreen === "timeline";
}

test("successful startup Handoff creates a Home entry before pushing Timeline", async () => {
  const environment = createDomTestEnvironment(`https://narrativeline.test/${handoffHash}`);
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};

  const calls = [];
  const history = environment.window.history;
  const originalReplaceState = history.replaceState.bind(history);
  const originalPushState = history.pushState.bind(history);
  history.replaceState = (state, title, url) => {
    calls.push({ method: "replaceState", state, url: String(url) });
    return originalReplaceState(state, title, url);
  };
  history.pushState = (state, title, url) => {
    calls.push({ method: "pushState", state, url: String(url) });
    return originalPushState(state, title, url);
  };

  const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  let fetchCount = 0;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: async (url) => {
      fetchCount += 1;
      assert.equal(url, handoffUrl);
      return { ok: true, text: async () => handoffDataset };
    },
  });

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });

  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);

    await act(async () => {
      root.render(React.createElement(LanguageProvider, null, React.createElement(App)));
    });
    await act(async () => {});

    const relevantCalls = calls.filter(relevantHistoryCall);
    const homeReplaceIndex = relevantCalls.findIndex((call) =>
      call.method === "replaceState" && call.state.narrativeLineView.currentScreen === "home");
    const timelinePushIndex = relevantCalls.findIndex((call) =>
      call.method === "pushState" && call.state.narrativeLineView.currentScreen === "timeline");

    assert.notEqual(homeReplaceIndex, -1);
    assert.notEqual(timelinePushIndex, -1);
    assert.ok(homeReplaceIndex < timelinePushIndex);
    assert.equal(relevantCalls[timelinePushIndex].url.endsWith(handoffHash), true);
    assert.equal(environment.window.location.hash, handoffHash);
    assert.equal(fetchCount, 1);
    assert.equal(environment.document.querySelector("h1")?.textContent, "タイムライン");
    assert.equal(
      relevantCalls.slice(homeReplaceIndex + 1, timelinePushIndex).some((call) =>
        call.method === "replaceState" && call.state.narrativeLineView.currentScreen === "timeline"),
      false,
    );
  } finally {
    await server.close();
    act(() => root.unmount());
    history.replaceState = originalReplaceState;
    history.pushState = originalPushState;
    if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
    else delete globalThis.fetch;
    environment.cleanup();
  }
});
