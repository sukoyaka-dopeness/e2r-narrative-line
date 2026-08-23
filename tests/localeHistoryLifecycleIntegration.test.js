import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

function navigationState(currentScreen) {
  return {
    narrativeLineView: {
      currentScreen,
      selectedEvent: null,
      selectedEntity: null,
      returnEventId: null,
      returnEntityId: null,
      draftEventId: null,
    },
  };
}

async function renderApp({ hash = "", persistedLocale, browserLanguage = "en-US", temporaryResolution } = {}) {
  const environment = createDomTestEnvironment(`https://narrativeline.test/${hash}`);
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  Object.defineProperty(environment.window.navigator, "languages", { configurable: true, value: [browserLanguage] });
  Object.defineProperty(environment.window.navigator, "language", { configurable: true, value: browserLanguage });
  if (persistedLocale) environment.window.localStorage.setItem("narrativeline.language", persistedLocale);
  if (temporaryResolution) environment.window.sessionStorage.setItem("narrativeline.localeTemporaryResolution", JSON.stringify(temporaryResolution));

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
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
      environment.cleanup();
    },
  };
}

async function dispatchHistoricalEntry(rendered, hash, screen) {
  rendered.window.history.replaceState(navigationState(screen), "", `${rendered.window.location.pathname}${rendered.window.location.search}${hash}`);
  await act(async () => rendered.window.dispatchEvent(new rendered.window.PopStateEvent("popstate", { state: navigationState(screen) })));
}

test("popstate restores historical view without re-resolving a different locale", async () => {
  const rendered = await renderApp({ hash: "#locale=ja", persistedLocale: "ja" });
  try {
    await dispatchHistoricalEntry(rendered, "#locale=en", "home");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "はじめる");
    assert.equal(rendered.window.location.hash, "#locale=en");
    assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "ja");
    assert.equal(rendered.document.querySelector('[role="dialog"]'), null);

    await dispatchHistoricalEntry(rendered, "#locale=ja", "timeline");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "タイムライン");
    assert.equal(rendered.document.querySelector('header button')?.textContent, "English");
    assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "ja");
  } finally {
    rendered.cleanup();
  }
});

test("popstate with no locale does not re-run browser fallback or add a fragment", async () => {
  const rendered = await renderApp({ persistedLocale: "en", browserLanguage: "ja-JP" });
  try {
    await dispatchHistoricalEntry(rendered, "", "home");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    assert.equal(rendered.window.location.hash, "");
    assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "en");
    assert.equal(rendered.document.querySelector('[role="dialog"]'), null);
  } finally {
    rendered.cleanup();
  }
});

test("popstate historical locale does not reopen startup Conflict or change persistence", async () => {
  const rendered = await renderApp({ hash: "#locale=en", persistedLocale: "en" });
  try {
    await dispatchHistoricalEntry(rendered, "#locale=ja", "home");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    assert.equal(rendered.window.location.hash, "#locale=ja");
    assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "en");
    assert.equal(rendered.window.sessionStorage.getItem("narrativeline.localeTemporaryResolution"), null);
    assert.equal(rendered.document.querySelector('[role="dialog"]'), null);
  } finally {
    rendered.cleanup();
  }
});

test("popstate leaves invalid historical locale untouched", async () => {
  const rendered = await renderApp({ hash: "#locale=en", persistedLocale: "en" });
  try {
    await dispatchHistoricalEntry(rendered, "#foo=bar&locale=fr&locale=ja", "home");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    assert.equal(rendered.window.location.hash, "#foo=bar&locale=fr&locale=ja");
    assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "en");
    assert.equal(rendered.document.querySelector('[role="dialog"]'), null);
  } finally {
    rendered.cleanup();
  }
});

test("popstate preserves temporary resolution without applying it", async () => {
  const temporary = { requestedLocale: "ja", effectiveLocale: "en" };
  const rendered = await renderApp({ hash: "#locale=en", persistedLocale: "en", temporaryResolution: temporary });
  try {
    await dispatchHistoricalEntry(rendered, "#locale=ja", "home");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    assert.equal(rendered.window.sessionStorage.getItem("narrativeline.localeTemporaryResolution"), JSON.stringify(temporary));
    assert.equal(rendered.window.location.hash, "#locale=ja");
  } finally {
    rendered.cleanup();
  }
});

test("popstate with historical datasetUrl does not refetch Handoff", async () => {
  let fetchCount = 0;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCount += 1;
    throw new Error("unexpected Handoff fetch");
  };
  const rendered = await renderApp({ hash: "#locale=en", persistedLocale: "en" });
  try {
    const beforePopstate = fetchCount;
    await dispatchHistoricalEntry(rendered, "#datasetUrl=https%3A%2F%2Fdata.example%2Fhistorical.json&locale=ja", "timeline");
    assert.equal(fetchCount, beforePopstate);
    assert.equal(rendered.window.location.hash, "#datasetUrl=https%3A%2F%2Fdata.example%2Fhistorical.json&locale=ja");
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Timeline");
  } finally {
    rendered.cleanup();
    globalThis.fetch = previousFetch;
  }
});
