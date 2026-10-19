import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const r1 = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [{ id: "berlin", name: "Berlin workspace" }],
  relations: [],
});
const r2 = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [{ id: "cedar", name: "Cedar workspace" }],
  relations: [],
});

test("a peer write between startup Dataset read and Coordinator initialization cannot be overwritten", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en");
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  const storage = environment.window.localStorage;
  storage.setItem("narrativeline.lastDataset", r1);
  const storagePrototype = Object.getPrototypeOf(storage);
  const originalGetItem = storagePrototype.getItem;
  let peerSaved = false;
  storagePrototype.getItem = function (key) {
    const value = originalGetItem.call(this, key);
    if (key === "narrativeline.lastDataset" && !peerSaved) {
      peerSaved = true;
      this.setItem(key, r2);
    }
    return value;
  };

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
    await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    assert.equal(peerSaved, true);
    assert.equal(originalGetItem.call(storage, "narrativeline.lastDataset"), r2);
    assert.match(container.querySelector('[role="alert"]')?.textContent ?? "", /older tab did not overwrite it/i);
    const resume = [...container.querySelectorAll(".home-actions > button")]
      .find((button) => button.textContent === "Continue Editing");
    assert.ok(resume, "the stale in-memory Dataset remains available to resume");
    await act(async () => resume.click());
    assert.match(container.textContent, /Berlin workspace/);
    assert.equal(originalGetItem.call(storage, "narrativeline.lastDataset"), r2);
  } finally {
    storagePrototype.getItem = originalGetItem;
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
  }
});
