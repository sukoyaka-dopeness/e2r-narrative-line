import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const retainedDataset = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [{ id: "event-shell-1", name: "Shell evidence event" }],
  relations: [],
  extensions: { metadata: { title: "Timeline shell evidence" } },
});

function findHeaderButton(document, label) {
  return Array.from(document.querySelectorAll("header button")).find(
    (button) => button.textContent === label,
  );
}

function findToolbarAction(document, label) {
  return Array.from(document.querySelectorAll(".timeline-toolbar button")).find(
    (button) => button.textContent === label,
  );
}

const findLowerAction = findToolbarAction;

async function renderApp() {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = "en";
  environment.window.scrollTo = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", retainedDataset);

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false },
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

test("accepts the production Timeline shell and preserves Dataset navigation", async () => {
  const rendered = await renderApp();
  try {
    await act(async () => rendered.document.querySelector(".home-actions button")?.click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Timeline");
    assert.equal(rendered.document.documentElement.lang, "en");

    const headerHome = findHeaderButton(rendered.document, "Home");
    const localeButton = findHeaderButton(rendered.document, "日本語");
    assert.ok(headerHome);
    assert.ok(localeButton);
    const toolbar = rendered.document.querySelector(".timeline-toolbar");
    assert.ok(toolbar);
    const toolbarButtons = [...toolbar.querySelectorAll("button")];
    assert.equal(toolbarButtons.length, 2);
    assert.equal(toolbarButtons[0].textContent, "Add Event");
    assert.equal(toolbarButtons[1].textContent, "More");
    assert.equal(findToolbarAction(rendered.document, "Export E2R JSON"), undefined);
    assert.equal(findToolbarAction(rendered.document, "Home"), undefined);
    assert.equal(rendered.document.body.textContent.includes("Shell evidence event"), true);

    await act(async () => headerHome.click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    const continueEditing = Array.from(rendered.document.querySelectorAll(".home-actions button")).find(
      (button) => button.textContent === "Continue Editing",
    );
    assert.ok(continueEditing);

    await act(async () => continueEditing.click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Timeline");
    assert.equal(rendered.document.body.textContent.includes("Shell evidence event"), true);

    await act(async () => findHeaderButton(rendered.document, "日本語")?.click());
    assert.equal(rendered.document.documentElement.lang, "ja");
    assert.equal(findHeaderButton(rendered.document, "ホーム")?.textContent, "ホーム");
    assert.equal(findHeaderButton(rendered.document, "English")?.textContent, "English");
    assert.equal(findLowerAction(rendered.document, "できごとを追加")?.textContent, "できごとを追加");
    assert.equal(findLowerAction(rendered.document, "ホーム"), undefined);
  } finally {
    rendered.cleanup();
  }
});
