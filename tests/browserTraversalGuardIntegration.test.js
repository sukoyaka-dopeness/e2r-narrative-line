import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";
import { readNarrativeLineNavigationIndex } from "../src/services/NavigationService.ts";

const dataset = JSON.stringify({
  version: "1.0",
  entities: [{ id: "entity-1", name: "Existing Entity" }],
  events: [{ id: "event-1", name: "Existing Event" }],
  relations: [{ id: "relation-1", sourceId: "event-1", targetId: "entity-1" }],
});

const coordinateDataset = JSON.stringify({
  version: "1.0",
  entities: [{ id: "entity-1", name: "Existing Entity", extensions: {
    "experimental.github.sukoyaka-dopeness.coordinate": { coordinates: [{ spaceId: "liaisonscape-graph", values: { x: 10, y: 20 } }] },
  } }],
  events: [{ id: "event-1", name: "Existing Event" }],
  relations: [{ id: "relation-1", sourceId: "event-1", targetId: "entity-1" }],
  extensions: { "experimental.github.sukoyaka-dopeness.coordinate": {
    formatVersion: "0.1.0",
    spaces: [{ id: "liaisonscape-graph", name: "Graph Space", kind: "cartesian-2d", components: {
      x: { unit: "liaisonscape-user-unit", positiveDirection: "display-right" },
      y: { unit: "liaisonscape-user-unit", positiveDirection: "display-down" },
    } }],
  } },
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

function headerButton(document, text) {
  return [...document.querySelectorAll("header button")].find((button) => button.textContent?.trim() === text);
}

function waitForPopStates(window, document, action, count) {
  return act(async () => {
    await new Promise((resolve) => {
      let seen = 0;
      const handle = () => {
        seen += 1;
        if (seen < count) return;
        window.removeEventListener("popstate", handle);
        resolve();
      };
      window.addEventListener("popstate", handle);
      action();
    });
    if (count === 2) await waitForDomCondition(window, document, () => Boolean(document.querySelector('[role="alertdialog"]')));
  });
}

async function renderApp(storedDataset = dataset) {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", storedDataset);
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.scrollTo = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const { createRoot } = await import("react-dom/client");
  let root = null;
  let App = null;
  let LanguageProvider = null;
  async function remountApp() {
    root = createRoot(container);
    const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false }, appType: "custom" });
    try {
      const [appModule, languageModule] = await Promise.all([
        server.ssrLoadModule("/src/App.tsx"),
        server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
      ]);
      App = appModule.default;
      LanguageProvider = languageModule.LanguageProvider;
      await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
    } finally {
      await server.close();
    }
  }
  function unmountApp() {
    act(() => root.unmount());
    root = null;
  }
  await remountApp();
  return {
    ...environment,
    remountApp,
    unmountApp,
    cleanup() { if (root) unmountApp(); environment.cleanup(); },
  };
}

function openEvent(document) {
  const resume = buttonByText(document, "Continue Editing");
  assert.ok(resume);
  act(() => resume.click());
  const card = [...document.querySelectorAll(".timeline-card")].find((item) => item.textContent?.includes("Existing Event"));
  assert.ok(card);
  act(() => card.click());
  const edit = buttonByText(document, "Edit");
  assert.ok(edit);
  act(() => edit.click());
}

function editEventName(document, window, value) {
  const input = document.querySelector('input[placeholder="Enter event name"]');
  assert.ok(input);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  assert.ok(setter);
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    input.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
}

function openRelatedEntity(document) {
  const related = document.querySelector(".related-card");
  assert.ok(related);
  act(() => related.click());
  const edit = buttonByText(document, "Edit Entity");
  assert.ok(edit);
  act(() => edit.click());
}

test("clean indexed Browser Back restores Timeline without a duplicate entry", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    const detailIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    assert.equal(detailIndex, 2);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
  } finally { rendered.cleanup(); }
});

test("dirty existing Event Browser Back rolls back, cancels, then confirms and replays", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    const detailIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    assert.equal(detailIndex, 2);
    editEventName(rendered.document, rendered.window, "Dirty Event");
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), detailIndex);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Dirty Event");
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), detailIndex);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Dirty Event");

    const rollbackAgain = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollbackAgain;
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
    assert.equal(rendered.document.body.textContent.includes("Dirty Event"), false);
  } finally { rendered.cleanup(); }
});

test("dirty existing Event Browser Forward uses the same rollback and replay guard", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    act(() => buttonByText(rendered.document, "Save and Add Related Entity").click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Add Related Entity");
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    editEventName(rendered.document, rendered.window, "Forward Dirty Event");
    const eventIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 2);
    await rollback;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), eventIndex);
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Forward Dirty Event");
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), eventIndex);
    const rollbackAgain = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 2);
    await rollbackAgain;
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.ok(rendered.document.querySelector(".entity-picker-screen"));
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), eventIndex + 1);
  } finally { rendered.cleanup(); }
});

test("draft Event Browser Back cancel preserves and confirm removes only the provisional Event", async () => {
  const rendered = await renderApp();
  try {
    const resume = buttonByText(rendered.document, "Continue Editing");
    assert.ok(resume);
    act(() => resume.click());
    const add = buttonByText(rendered.document, "Add Event");
    assert.ok(add);
    act(() => add.click());
    const draftIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), draftIndex);
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    const rollbackAgain = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollbackAgain;
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.querySelectorAll(".timeline-card").length, 1);
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
  } finally { rendered.cleanup(); }
});

test("same-screen sanitized Timeline restoration does not suppress the next user navigation history entry", async () => {
  const rendered = await renderApp();
  try {
    const resume = buttonByText(rendered.document, "Continue Editing");
    assert.ok(resume);
    act(() => resume.click());
    const add = buttonByText(rendered.document, "Add Event");
    assert.ok(add);
    act(() => add.click());
    assert.ok(rendered.document.querySelector(".detail-screen--event"));

    const draftEventId = rendered.window.history.state.narrativeLineView.draftEventId;
    assert.ok(draftEventId);
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.window.history.state.narrativeLineView.currentScreen, "timeline");
    assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, null);
    assert.equal(rendered.window.history.state.narrativeLineView.draftEventId, null);

    const forward = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    await forward;
    const sanitizedIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    assert.equal(rendered.document.querySelector(".timeline-screen") !== null, true);
    assert.equal(rendered.document.querySelector(".detail-screen--event"), null);
    assert.equal(rendered.window.history.state.narrativeLineView.currentScreen, "timeline");
    assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, null);
    assert.equal(rendered.window.history.state.narrativeLineView.draftEventId, null);
    assert.equal(typeof sanitizedIndex, "number");

    const existingCard = [...rendered.document.querySelectorAll(".timeline-card")]
      .find((card) => card.textContent?.includes("Existing Event"));
    assert.ok(existingCard);
    act(() => existingCard.click());
    const edit = buttonByText(rendered.document, "Edit");
    assert.ok(edit);
    act(() => edit.click());

    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), sanitizedIndex + 1);
    assert.equal(rendered.window.history.state.narrativeLineView.currentScreen, "eventDetail");
    assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, "event-1");
    assert.equal(rendered.window.history.state.narrativeLineView.draftEventId, null);
    assert.equal(rendered.window.history.state.narrativeLineView.navigationIndex, sanitizedIndex + 1);
    assert.equal(rendered.window.history.state.narrativeLineView.currentScreen, "eventDetail");
    assert.equal(draftEventId !== rendered.window.history.state.narrativeLineView.selectedEvent, true);
  } finally { rendered.cleanup(); }
});

test("dirty Entity Detail Browser Back guards and confirmed replay discards only the draft", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    openRelatedEntity(rendered.document);
    const entityInput = rendered.document.querySelector('input[placeholder="Enter a person, organization, place, or other entity"]');
    assert.ok(entityInput);
    const setter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    act(() => { setter.call(entityInput, "Dirty Entity"); entityInput.dispatchEvent(new rendered.window.Event("input", { bubbles: true })); entityInput.dispatchEvent(new rendered.window.Event("change", { bubbles: true })); });
    const currentIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), currentIndex);
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    const rollbackAgain = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollbackAgain;
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
  } finally { rendered.cleanup(); }
});

test("Coordinate-only Entity pending work is guarded and Cancel preserves the editor", async () => {
  const rendered = await renderApp(coordinateDataset);
  try {
    openEvent(rendered.document);
    openRelatedEntity(rendered.document);
    act(() => buttonByText(rendered.document, "Edit Recorded Coordinate").click());
    const x = rendered.document.querySelector('input[aria-label="x"]');
    assert.ok(x);
    const setter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    act(() => { setter.call(x, "99"); x.dispatchEvent(new rendered.window.Event("input", { bubbles: true })); x.dispatchEvent(new rendered.window.Event("change", { bubbles: true })); });
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(rendered.document.querySelector('input[aria-label="x"]')?.value, "99");
    assert.ok(buttonByText(rendered.document, "Save Coordinate"));
  } finally { rendered.cleanup(); }
});

test("Entity Create draft is guarded while an empty Create screen stays clean", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    act(() => buttonByText(rendered.document, "Save and Add Related Entity").click());
    act(() => buttonByText(rendered.document, "Create New Entity").click());
    const cleanBack = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    await cleanBack;
    assert.ok(rendered.document.querySelector(".entity-picker-screen"));
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    act(() => buttonByText(rendered.document, "Create New Entity").click());
    const name = rendered.document.querySelector('input[placeholder="Enter a person, organization, place, or other entity"]');
    assert.ok(name);
    const setter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    act(() => { setter.call(name, "Draft Person"); name.dispatchEvent(new rendered.window.Event("input", { bubbles: true })); name.dispatchEvent(new rendered.window.Event("change", { bubbles: true })); });
    const draftIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), draftIndex);
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.equal(rendered.document.querySelector('input[placeholder="Enter a person, organization, place, or other entity"]')?.value, "Draft Person");
  } finally { rendered.cleanup(); }
});

test("confirmed draft Event discard sanitizes its abandoned Forward entry", async () => {
  const rendered = await renderApp();
  try {
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    act(() => buttonByText(rendered.document, "Add Event").click());
    const draftIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), draftIndex - 1);
    assert.equal(rendered.document.body.textContent.includes("Abandoned Draft Event"), false);

    let popstates = 0;
    const observe = () => { popstates += 1; };
    rendered.window.addEventListener("popstate", observe);
    const forward = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    await forward;
    rendered.window.removeEventListener("popstate", observe);
    assert.equal(popstates, 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), draftIndex);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.querySelector(".detail-screen--event"), null);
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
  } finally { rendered.cleanup(); }
});

test("confirmed Entity Create discard sanitizes its abandoned Forward entry", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    act(() => buttonByText(rendered.document, "Save and Add Related Entity").click());
    const pickerIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    act(() => buttonByText(rendered.document, "Create New Entity").click());
    const createIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const name = rendered.document.querySelector('input[placeholder="Enter a person, organization, place, or other entity"]');
    assert.ok(name);
    const setter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    act(() => { setter.call(name, "Abandoned Draft Person"); name.dispatchEvent(new rendered.window.Event("input", { bubbles: true })); name.dispatchEvent(new rendered.window.Event("change", { bubbles: true })); });
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), pickerIndex);
    assert.ok(rendered.document.querySelector(".entity-picker-screen"));
    assert.equal(rendered.document.body.textContent.includes("Abandoned Draft Person"), false);
    assert.equal(rendered.document.querySelectorAll(".entity-card").length, 0);

    const forward = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    await forward;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), createIndex);
    assert.ok(rendered.document.querySelector(".entity-picker-screen"));
    assert.equal(rendered.document.querySelector(".entity-create-screen"), null);
    assert.equal(rendered.document.body.textContent.includes("Abandoned Draft Person"), false);
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, "event-1");
  } finally { rendered.cleanup(); }
});

test("Header confirmation remains authoritative during Browser Back", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    editEventName(rendered.document, rendered.window, "Header Dirty Event");
    act(() => headerButton(rendered.document, "Back").click());
    assert.equal(rendered.document.querySelectorAll('[role="alertdialog"]').length, 1);
    const currentIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const rollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await rollback;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), currentIndex);
    assert.equal(rendered.document.querySelectorAll('[role="alertdialog"]').length, 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Header Dirty Event");
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), currentIndex);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Header Dirty Event");
  } finally { rendered.cleanup(); }
});

test("first Browser confirmation intent wins over a second different traversal", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    act(() => buttonByText(rendered.document, "Save and Add Related Entity").click());
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    const eventIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    editEventName(rendered.document, rendered.window, "First Intent Event");
    const firstRollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 2);
    await firstRollback;
    assert.equal(rendered.document.querySelectorAll('[role="alertdialog"]').length, 1);
    const secondRollback = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 2);
    await secondRollback;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), eventIndex);
    assert.equal(rendered.document.querySelectorAll('[role="alertdialog"]').length, 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.equal(rendered.document.querySelector(".entity-picker-screen"), null);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "First Intent Event");
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    const replay = waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    await replay;
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.querySelector(".entity-picker-screen"), null);
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), eventIndex - 1);
    assert.equal(rendered.document.body.textContent.includes("First Intent Event"), false);
  } finally { rendered.cleanup(); }
});

function makeCurrentEntryLegacy(window) {
  const current = window.history.state;
  const owned = { ...current.narrativeLineView };
  delete owned.navigationIndex;
  window.history.replaceState({ ...current, narrativeLineView: owned }, "", window.location.href);
}

async function restoreLegacyDraftFixture(rendered) {
  const resume = buttonByText(rendered.document, "Continue Editing");
  assert.ok(resume);
  act(() => resume.click());
  const add = buttonByText(rendered.document, "Add Event");
  assert.ok(add);
  act(() => add.click());
  const draftEventId = rendered.window.history.state.narrativeLineView.draftEventId;
  assert.ok(draftEventId);
  assert.equal(rendered.window.history.state.narrativeLineView.currentScreen, "eventDetail");
  assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, draftEventId);
  assert.equal(typeof readNarrativeLineNavigationIndex(rendered.window.history.state), "number");
  const storedBefore = JSON.parse(rendered.window.localStorage.getItem("narrativeline.lastDataset"));
  assert.ok(storedBefore.events.some((event) => event.id === "event-1"));
  assert.ok(storedBefore.events.some((event) => event.id === draftEventId));

  rendered.unmountApp();
  makeCurrentEntryLegacy(rendered.window);
  assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), undefined);
  await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
  await rendered.remountApp();
  await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
  assert.ok(rendered.document.querySelector(".detail-screen--event"));
  assert.equal(rendered.window.history.state.narrativeLineView.draftEventId, draftEventId);
  assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), undefined);
  assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
  return draftEventId;
}

test("real legacy draft Event restoration clears the index before safe-rebase Cancel", async () => {
  const rendered = await renderApp();
  try {
    const draftEventId = await restoreLegacyDraftFixture(rendered);
    editEventName(rendered.document, rendered.window, "Legacy Restored Draft");
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Restored Draft");
    const rebase = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    await rebase;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Restored Draft");
    const stored = JSON.parse(rendered.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.ok(stored.events.some((event) => event.id === draftEventId));
    assert.ok(stored.events.some((event) => event.id === "event-1"));
    assert.equal(rendered.window.history.length, 3);
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Restored Draft");
  } finally { rendered.cleanup(); }
});

test("real legacy draft Event restoration confirms discard and sanitizes Forward", async () => {
  const rendered = await renderApp();
  try {
    const draftEventId = await restoreLegacyDraftFixture(rendered);
    editEventName(rendered.document, rendered.window, "Legacy Confirmed Draft");
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    await waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 0);
    assert.notEqual(rendered.window.history.state.narrativeLineView.currentScreen, "eventDetail");
    const stored = JSON.parse(rendered.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(stored.events.some((event) => event.id === draftEventId), false);
    assert.ok(stored.events.some((event) => event.id === "event-1"));
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.equal(rendered.window.history.state.narrativeLineView.currentScreen, "timeline");
    assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, null);
    assert.equal(rendered.window.history.state.narrativeLineView.draftEventId, null);
    assert.equal(rendered.document.querySelector(".detail-screen--event"), null);
  } finally { rendered.cleanup(); }
});

test("indexed dirty Event to legacy Timeline uses safe rebase and Cancel preserves work", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    const detailIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    makeCurrentEntryLegacy(rendered.window);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), undefined);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), detailIndex);
    editEventName(rendered.document, rendered.window, "Legacy Dirty Event");
    const rebase = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    await rebase;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.equal(rendered.document.querySelectorAll('[role="alertdialog"]').length, 1);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Dirty Event");
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Dirty Event");
  } finally { rendered.cleanup(); }
});

test("indexed dirty Event to legacy Timeline confirms through the rebased 0-to-1 segment", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    makeCurrentEntryLegacy(rendered.window);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    editEventName(rendered.document, rendered.window, "Legacy Confirm Event");
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    await waitForPopStates(rendered.window, rendered.document, () => discard.click(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 0);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.body.textContent.includes("Legacy Confirm Event"), false);
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Existing Event");
  } finally { rendered.cleanup(); }
});

test("stale indexed Event history is reconciled and normalized in place", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    const staleIndex = readNarrativeLineNavigationIndex(rendered.window.history.state);
    const staleState = {
      ...rendered.window.history.state,
      narrativeLineView: {
        ...rendered.window.history.state.narrativeLineView,
        selectedEvent: "missing-event",
      },
    };
    rendered.window.history.replaceState(staleState, "", rendered.window.location.href);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), staleIndex);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.window.history.state.narrativeLineView.currentScreen, "timeline");
    assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, null);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), staleIndex);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.window.history.state.narrativeLineView.selectedEvent, null);
  } finally { rendered.cleanup(); }
});

test("clean legacy current restoration clears the index ref before safe rebase", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    const detailState = { ...rendered.window.history.state, narrativeLineView: { ...rendered.window.history.state.narrativeLineView } };
    delete detailState.narrativeLineView.navigationIndex;
    rendered.window.history.replaceState(detailState, "", rendered.window.location.href);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), undefined);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    editEventName(rendered.document, rendered.window, "Legacy Current Dirty Event");
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Current Dirty Event");
    act(() => buttonByText(rendered.document, "Continue Editing").click());
  } finally { rendered.cleanup(); }
});

test("Header confirmation remains authoritative when Browser target is legacy", async () => {
  const rendered = await renderApp();
  try {
    openEvent(rendered.document);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    makeCurrentEntryLegacy(rendered.window);
    await waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.forward(), 1);
    editEventName(rendered.document, rendered.window, "Legacy Header Dirty Event");
    act(() => headerButton(rendered.document, "Back").click());
    assert.equal(rendered.document.querySelectorAll('[role="alertdialog"]').length, 1);
    const rebase = waitForPopStates(rendered.window, rendered.document, () => rendered.window.history.back(), 1);
    await rebase;
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.equal(rendered.document.querySelectorAll('[role="alertdialog"]').length, 1);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Header Dirty Event");
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.equal(readNarrativeLineNavigationIndex(rendered.window.history.state), 1);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter event name"]')?.value, "Legacy Header Dirty Event");
  } finally { rendered.cleanup(); }
});
