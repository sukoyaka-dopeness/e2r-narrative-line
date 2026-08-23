import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const handoffUrl = "https://fixture.invalid/dataset.json";
const englishFailure = "Could not retrieve the Dataset from the handoff link.";

async function withViteServer(callback) {
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });

  try {
    return await callback(server);
  } finally {
    await server.close();
  }
}

async function renderApp({ hash, persistedLocale, fetcher }) {
  const environment = createDomTestEnvironment(`https://narrativeline.test/${hash}`);
  environment.window.scrollTo = () => {};
  if (persistedLocale) environment.window.localStorage.setItem("narrativeline.language", persistedLocale);

  const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: fetcher });
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);

  await withViteServer(async (server) => {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => {
      root.render(React.createElement(
        LanguageProvider,
        null,
        React.createElement(App),
      ));
    });
  });

  return {
    ...environment,
    root,
    restore() {
      act(() => root.unmount());
      if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
      else delete globalThis.fetch;
      environment.cleanup();
    },
  };
}

test("renders a Japanese alert for a failed handoff with effective Japanese", async () => {
  let fetchCount = 0;
  const rendered = await renderApp({
    hash: `#datasetUrl=${encodeURIComponent(handoffUrl)}&locale=ja`,
    fetcher: async () => {
      fetchCount += 1;
      return { ok: false };
    },
  });

  try {
    await act(async () => {});
    const alert = rendered.document.querySelector('[role="alert"]');
    assert.ok(alert);
    assert.notEqual(alert.textContent, englishFailure);
    assert.match(alert.textContent, /Dataset/);
    assert.equal(fetchCount, 1);
  } finally {
    rendered.restore();
  }
});

test("renders an English alert for a failed handoff with effective English", async () => {
  let fetchCount = 0;
  const rendered = await renderApp({
    hash: `#datasetUrl=${encodeURIComponent(handoffUrl)}&locale=en`,
    persistedLocale: "en",
    fetcher: async () => {
      fetchCount += 1;
      return { ok: false };
    },
  });

  try {
    await act(async () => {});
    assert.equal(rendered.document.querySelector('[role="alert"]')?.textContent, englishFailure);
    assert.equal(fetchCount, 1);
  } finally {
    rendered.restore();
  }
});

test("resolves requested Japanese before one failed handoff without changing persisted English", async () => {
  let fetchCount = 0;
  const rendered = await renderApp({
    hash: `#datasetUrl=${encodeURIComponent(handoffUrl)}&locale=ja`,
    persistedLocale: "en",
    fetcher: async () => {
      fetchCount += 1;
      return { ok: false };
    },
  });

  try {
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.equal(fetchCount, 0);

    const requestedJapanese = rendered.document.querySelector('button[lang="ja"]');
    assert.ok(requestedJapanese);
    await act(async () => requestedJapanese.click());

    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(fetchCount, 1);
    const alert = rendered.document.querySelector('[role="alert"]');
    assert.ok(alert);
    assert.notEqual(alert.textContent, englishFailure);
    assert.match(alert.textContent, /Dataset/);
    assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "en");
  } finally {
    rendered.restore();
  }
});
