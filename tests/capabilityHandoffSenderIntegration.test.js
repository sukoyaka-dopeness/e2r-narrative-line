import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createServer } from "vite";
import { createRoot } from "react-dom/client";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const relationId = "relation-full-canonical-id";
const sourceDatasetUrl = "https://datasets.example.test/current.json";
const dataset = JSON.stringify({
  version: "1.0",
  entities: [{ id: "entity-1", name: "Alice" }],
  events: [{ id: "event-1", name: "Meeting" }],
  relations: [{ id: relationId, name: "Knows", sourceId: "event-1", targetId: "entity-1" }],
});

function buttonByText(document, text) {
  return [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === text);
}

function waitForDomCondition(window, document, predicate) {
  if (predicate()) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new window.MutationObserver(() => {
      if (!predicate()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}

async function renderApp() {
  const environment = createDomTestEnvironment(
    `https://narrativeline.test/#datasetUrl=${encodeURIComponent(sourceDatasetUrl)}`,
  );
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.scrollTo = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.installGlobal("fetch", async () => ({ ok: true, text: async () => dataset }));

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
    appType: "custom",
  });
  try {
    const [appModule, languageModule] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => {
      root.render(React.createElement(
        languageModule.LanguageProvider,
        null,
        React.createElement(appModule.default),
      ));
    });
  } finally {
    await server.close();
  }

  await waitForDomCondition(environment.window, environment.document, () =>
    Boolean(environment.document.querySelector(".timeline-screen")));
  return {
    ...environment,
    container,
    root,
    cleanup: async () => {
      act(() => root.unmount());
      await environment.cleanup();
    },
  };
}

async function openRelationBlocker(rendered) {
  const timelineCard = rendered.document.querySelector(".timeline-card");
  assert.ok(timelineCard);
  await act(async () => timelineCard.click());
  const editEvent = buttonByText(rendered.document, "Edit");
  assert.ok(editEvent);
  await act(async () => editEvent.click());
  const relatedCard = rendered.document.querySelector(".related-card");
  assert.ok(relatedCard);
  await act(async () => relatedCard.click());
  const editEntity = buttonByText(rendered.document, "Edit Entity");
  assert.ok(editEntity);
  await act(async () => editEntity.click());
  const deleteEntity = buttonByText(rendered.document, "Delete Entity");
  assert.ok(deleteEntity);
  await act(async () => deleteEntity.click());
  return rendered.document.querySelector('[role="alertdialog"]');
}

test("accepted clean Handoff exposes one same-tab anchor for the exact Relation", async () => {
  const rendered = await renderApp();
  try {
    const dialog = await openRelationBlocker(rendered);
    assert.ok(dialog);
    const anchor = dialog.querySelector(".entity-delete-connection__handoff");
    assert.ok(anchor);
    assert.equal(anchor.textContent, "Open in LiaisonScape");
    assert.equal(anchor.getAttribute("target"), null);

    const handoffUrl = new URL(anchor.getAttribute("href"));
    const parameters = new URLSearchParams(handoffUrl.hash.slice(1));
    assert.equal(handoffUrl.pathname, "/e2r-liaison-scape/");
    assert.equal(parameters.get("datasetUrl"), sourceDatasetUrl);
    assert.equal(parameters.get("targetObjectId"), relationId);
    assert.equal(parameters.get("targetObjectType"), "Relation");
    assert.equal(parameters.get("requiredCapability"), "relation.inspect");
    assert.equal(parameters.get("targetContractVersion"), "1");
    assert.equal(parameters.get("locale"), "en");
    assert.equal(rendered.document.querySelector('[aria-labelledby="delete-entity-heading"]'), null);
  } finally {
    await rendered.cleanup();
  }
});
