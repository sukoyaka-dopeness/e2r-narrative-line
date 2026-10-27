import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

test("new Dataset persists and restores its exact Metadata declaration", async () => {
  const environment = createDomTestEnvironment("https://f1-disposable.test/#locale=en");
  environment.window.scrollTo = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
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
    await server.close();
    const mount = async (key) => {
      await act(async () => root.render(React.createElement(LanguageProvider, { key }, React.createElement(App))));
      await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    };
    await mount(1);
    const create = [...container.querySelectorAll(".home-actions > button")]
      .find((button) => button.textContent === "New Dataset");
    assert.ok(create);
    await act(async () => create.click());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    const storage = environment.window.localStorage;
    const readSaved = () => JSON.parse(storage.getItem("narrativeline.lastDataset"));
    const expected = {
      specVersion: "0.1.0",
      uses: [{ extension: "metadata", version: "1.0.0" }],
    };
    assert.deepEqual(readSaved().extensions["draft.github.sukoyaka-dopeness.specification"], expected);
    const id = readSaved().extensions.metadata.datasetId;

    const title = container.querySelector("#dataset-title-input");
    assert.ok(title);
    await act(async () => {
      Object.getOwnPropertyDescriptor(environment.window.HTMLInputElement.prototype, "value").set.call(title, "F1 disposable title");
      title.dispatchEvent(new environment.window.Event("input", { bubbles: true }));
    });
    const apply = [...container.querySelectorAll(".dataset-title-editor button")]
      .find((button) => button.textContent === "Apply title");
    assert.ok(apply);
    await act(async () => apply.click());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(readSaved().extensions.metadata.title, "F1 disposable title");
    assert.equal(readSaved().extensions.metadata.datasetId, id);
    assert.deepEqual(readSaved().extensions["draft.github.sukoyaka-dopeness.specification"], expected);

    await mount(2);
    const resume = [...container.querySelectorAll(".home-actions > button")]
      .find((button) => button.textContent === "Continue Editing");
    assert.ok(resume);
    await act(async () => resume.click());
    assert.equal(container.querySelector("#dataset-title-input")?.value, "F1 disposable title");
    assert.equal(container.querySelector(".import-information"), null);
    assert.deepEqual(readSaved().extensions["draft.github.sukoyaka-dopeness.specification"], expected);
  } finally {
    await act(async () => root.unmount());
    await server.close();
    environment.cleanup();
  }
});
