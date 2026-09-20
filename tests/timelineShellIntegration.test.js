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
    (button) => button.getAttribute("aria-label") === label || button.textContent === label,
  );
}

const findLowerAction = findToolbarAction;

async function renderApp() {
  const environment = createDomTestEnvironment({ url: "https://narrativeline.test/" });
  environment.document.documentElement.lang = "en";
  environment.window.scrollTo = () => {};
  const scrollIntoViewCalls = [];
  let intersectionCallback;
  environment.window.IntersectionObserver = class {
    constructor(callback) {
      intersectionCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
  environment.window.HTMLElement.prototype.scrollIntoView = function (options) {
    scrollIntoViewCalls.push({ id: this.id, options });
  };
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", retainedDataset);

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  environment.addCleanup(() => server.close());
  const root = createRoot(container);
  environment.addCleanup(() => act(async () => root.unmount()));

  const [{ default: App }, { LanguageProvider }] = await Promise.all([
    server.ssrLoadModule("/src/App.tsx"),
    server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
  ]);
  await act(async () => {
    root.render(React.createElement(LanguageProvider, null, React.createElement(App)));
  });

  return {
    ...environment,
    root,
    scrollIntoViewCalls,
    setTopIntersection: (isIntersecting) =>
      intersectionCallback([{ target: environment.document.querySelector(".timeline-screen > div"), isIntersecting }]),
    setFooterIntersection: (isIntersecting) =>
      intersectionCallback([{ target: environment.document.getElementById("timeline-footer"), isIntersecting }]),
    async cleanup() {
      await environment.cleanup();
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
    const localeButton = findHeaderButton(rendered.document, "\u65e5\u672c\u8a9e");
    assert.ok(headerHome);
    assert.ok(localeButton);
    assert.ok(rendered.document.getElementById("timeline-footer"));

    const toolbar = rendered.document.querySelector(".timeline-toolbar");
    assert.ok(toolbar);
    const toolbarButtons = [...toolbar.querySelectorAll("button")];
    assert.equal(toolbarButtons.length, 3);
    assert.equal(toolbarButtons[0].textContent, "Add Event");
    assert.equal(toolbarButtons[1].getAttribute("aria-label"), "Bottom");
    assert.equal(toolbarButtons[2].textContent, "More");
    assert.equal(findToolbarAction(rendered.document, "Top"), undefined);
    assert.equal(findToolbarAction(rendered.document, "Export E2R JSON"), undefined);
    assert.equal(findToolbarAction(rendered.document, "Home"), undefined);
    assert.equal(rendered.document.body.textContent.includes("Shell evidence event"), true);

    await act(async () => rendered.setTopIntersection(false));
    await act(async () => rendered.setFooterIntersection(false));
    const backToTop = findToolbarAction(rendered.document, "Top");
    const backToBottom = findToolbarAction(rendered.document, "Bottom");
    assert.ok(backToTop);
    assert.ok(backToBottom);
    assert.deepEqual(
      [...rendered.document.querySelectorAll(".timeline-toolbar__actions button")].map(
        (button) => button.getAttribute("aria-label") ?? button.textContent,
      ),
      ["Add Event", "Top", "Bottom", "More"],
    );

    const scrollCalls = [];
    rendered.window.scrollTo = (options) => scrollCalls.push(options);
    backToTop.focus();
    const focusedBeforeTopNavigation = rendered.document.activeElement;
    await act(async () => backToTop.click());
    assert.deepEqual(scrollCalls, [{ top: 0, left: 0, behavior: "auto" }]);
    assert.equal(rendered.document.activeElement, focusedBeforeTopNavigation);

    backToBottom.focus();
    const focusedBeforeBottomNavigation = rendered.document.activeElement;
    await act(async () => backToBottom.click());
    assert.deepEqual(rendered.scrollIntoViewCalls.at(-1), {
      id: "timeline-footer",
      options: { block: "end", behavior: "auto" },
    });
    assert.equal(rendered.document.activeElement, focusedBeforeBottomNavigation);

    await act(async () => rendered.setFooterIntersection(true));
    assert.equal(findToolbarAction(rendered.document, "Bottom"), undefined);
    assert.ok(findToolbarAction(rendered.document, "Top"));

    await act(async () => rendered.setTopIntersection(true));
    assert.equal(findToolbarAction(rendered.document, "Top"), undefined);
    assert.equal(findToolbarAction(rendered.document, "Bottom"), undefined);

    await act(async () => headerHome.click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started");
    const continueEditing = Array.from(rendered.document.querySelectorAll(".home-actions button")).find(
      (button) => button.textContent === "Continue Editing",
    );
    assert.ok(continueEditing);

    await act(async () => continueEditing.click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Timeline");
    assert.equal(rendered.document.body.textContent.includes("Shell evidence event"), true);

    await act(async () => findHeaderButton(rendered.document, "\u65e5\u672c\u8a9e")?.click());
    assert.equal(rendered.document.documentElement.lang, "ja");
    assert.equal(findHeaderButton(rendered.document, "\u30db\u30fc\u30e0")?.textContent, "\u30db\u30fc\u30e0");
    assert.equal(findHeaderButton(rendered.document, "English")?.textContent, "English");
    assert.equal(findLowerAction(rendered.document, "\u3067\u304d\u3054\u3068\u3092\u8ffd\u52a0")?.textContent, "\u3067\u304d\u3054\u3068\u3092\u8ffd\u52a0");
    assert.equal(findLowerAction(rendered.document, "\u30db\u30fc\u30e0"), undefined);
    await act(async () => rendered.setTopIntersection(false));
    await act(async () => rendered.setFooterIntersection(false));
    assert.ok(findLowerAction(rendered.document, "\u4e0a\u3078"));
    assert.ok(findLowerAction(rendered.document, "\u4e0b\u3078"));
    assert.deepEqual(
      [...rendered.document.querySelectorAll(".timeline-toolbar__actions button")].map(
        (button) => button.getAttribute("aria-label") ?? button.textContent,
      ),
      ["\u3067\u304d\u3054\u3068\u3092\u8ffd\u52a0", "\u4e0a\u3078", "\u4e0b\u3078", "\u305d\u306e\u4ed6"],
    );
  } finally {
    await rendered.cleanup();
  }
});
