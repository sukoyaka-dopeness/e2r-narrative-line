import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

async function withViteServer(callback) {
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });

  try {
    return await callback(server);
  } finally {
    await server.close();
  }
}

async function loadWithVite(modulePath) {
  return withViteServer((server) => server.ssrLoadModule(modulePath));
}

test("loads production AppFrame TSX through Vite SSR transform", async () => {
  const module = await loadWithVite("/src/components/AppFrame.tsx");
  assert.equal(typeof module.AppFrame, "function");
});

test("loads the production App TSX import chain through Vite SSR transform", async () => {
  const module = await loadWithVite("/src/App.tsx");
  assert.equal(typeof module.default, "function");
});

test("renders a production AppFrame through Vite and the shared jsdom harness", async () => {
  const environment = createDomTestEnvironment();
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);

  try {
    await withViteServer(async (server) => {
      const [{ AppFrame }, { LanguageProvider }] = await Promise.all([
        server.ssrLoadModule("/src/components/AppFrame.tsx"),
        server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
      ]);

      act(() => {
        root.render(React.createElement(
          LanguageProvider,
          null,
          React.createElement(AppFrame, { showFooter: true }, React.createElement("h1", null, "Timeline")),
        ));
      });
    });

    assert.equal(environment.document.querySelector("h1")?.textContent, "Timeline");
    assert.ok(environment.document.querySelector('button[type="button"]'));
    assert.equal(environment.document.querySelector("footer")?.textContent.includes("Credits"), true);
  } finally {
    act(() => root.unmount());
    environment.cleanup();
  }
});
