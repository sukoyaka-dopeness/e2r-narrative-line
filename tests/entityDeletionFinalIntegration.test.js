import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const dataset = JSON.stringify({
  version: "1.0",
  entities: [
    { id: "entity-nl-final", name: "NL Final Target" },
    { id: "entity-unrelated", name: "Unrelated Entity" },
  ],
  events: [{ id: "event-hidden", name: "Hidden Event", extensions: { history: { time: { year: 2026, month: 8, day: 28 } } } }],
  relations: [
    { id: "relation-nl-final", name: "NL final link", sourceId: "entity-nl-final", targetId: "entity-unrelated" },
    { id: "relation-nav-nl-final", name: "Timeline navigation link", sourceId: "event-hidden", targetId: "entity-nl-final" },
  ],
});

function buttonByText(document, text) {
  return [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === text);
}

async function renderApp() {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = "en";
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", dataset);
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.scrollTo = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, port: 0, strictPort: false }, appType: "custom" });
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
    environment,
    document: environment.document,
    cleanup() { act(() => root.unmount()); environment.cleanup(); },
  };
}

function openFinalEntityDetail(document) {
  act(() => buttonByText(document, "Continue Editing").click());
  const eventCard = [...document.querySelectorAll(".timeline-card")].find((card) => card.textContent?.includes("Hidden Event"));
  assert.ok(eventCard);
  act(() => eventCard.dispatchEvent(new document.defaultView.MouseEvent("click", { bubbles: true })));
  act(() => buttonByText(document, "Edit").click());
  const relatedCard = document.querySelector(".related-card");
  assert.ok(relatedCard);
  act(() => relatedCard.click());
  act(() => buttonByText(document, "Edit Entity").click());
}

function removeRelationFromResolution(document) {
  const relation = document.querySelector(".entity-delete-connection > button");
  assert.ok(relation);
  act(() => relation.click());
  act(() => buttonByText(document, "Remove").click());
}

test("final Entity confirmation removes the target after all incident Relations are resolved", async () => {
  const rendered = await renderApp();
  try {
    openFinalEntityDetail(rendered.document);
    act(() => buttonByText(rendered.document, "Delete Entity").click());
    assert.equal(rendered.document.querySelectorAll(".entity-delete-connection").length, 2);

    removeRelationFromResolution(rendered.document);
    removeRelationFromResolution(rendered.document);
    const resolution = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(resolution?.textContent?.includes("All blocking connections are resolved."));

    act(() => resolution.querySelector(".modal-actions .danger-action").click());
    const firstConfirmation = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(firstConfirmation?.textContent?.includes("This permanently removes the Entity"));
    act(() => firstConfirmation.querySelector(".modal-actions button").click());

    act(() => buttonByText(rendered.document, "Delete Entity").click());
    const finalConfirmation = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(finalConfirmation?.textContent?.includes("This permanently removes the Entity"));
    act(() => finalConfirmation.querySelector(".modal-actions .danger-action").click());

    const saved = JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(saved.entities.some(({ id }) => id === "entity-nl-final"), false);
    assert.equal(saved.entities.some(({ id }) => id === "entity-unrelated"), true);
    assert.equal(saved.events.some(({ id }) => id === "event-hidden"), true);
    assert.equal(saved.relations.some(({ id }) => id === "relation-nl-final"), false);
    assert.equal(saved.relations.some(({ id }) => id === "relation-nav-nl-final"), false);
  } finally {
    rendered.cleanup();
  }
});
