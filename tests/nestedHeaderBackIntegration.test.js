import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const dataset = JSON.stringify({
  version: "1.0",
  entities: [{ id: "entity-1", name: "Existing Entity" }],
  events: [{ id: "event-1", name: "Existing Event", extensions: { history: { time: { year: 2024, month: 1, day: 2 } } } }],
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
    spaces: [{ id: "liaisonscape-graph", name: "Graph Space", kind: "cartesian-2d", components: { x: { unit: "liaisonscape-user-unit", positiveDirection: "display-right" }, y: { unit: "liaisonscape-user-unit", positiveDirection: "display-down" } } }],
  } },
});

function buttonByText(document, text) {
  return [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === text);
}

function headerButtonByText(document, text) {
  return [...document.querySelectorAll("header button")].find((button) => button.textContent?.trim() === text);
}

function headerBack(document) {
  return headerButtonByText(document, "Back") ?? [...document.querySelectorAll("header button")].find((button) => button.textContent?.trim() === "戻る");
}

function localeButton(document) {
  return headerButtonByText(document, "日本語") ?? headerButtonByText(document, "English");
}

async function renderApp({ persistedLocale = "en", storedDataset = dataset } = {}) {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = persistedLocale;
  environment.window.localStorage.setItem("narrativeline.language", persistedLocale);
  environment.window.localStorage.setItem("narrativeline.lastDataset", storedDataset);
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
    ...environment,
    cleanup() { act(() => root.unmount()); environment.cleanup(); },
  };
}

function openTimeline(document) {
  const resume = buttonByText(document, "Continue Editing");
  assert.ok(resume);
  act(() => resume.click());
}

function openEvent(document) {
  const card = [...document.querySelectorAll(".timeline-card")].find((item) => item.textContent?.includes("Existing Event"));
  assert.ok(card);
  act(() => card.dispatchEvent(new document.defaultView.MouseEvent("click", { bubbles: true })));
  const edit = buttonByText(document, "Edit");
  assert.ok(edit);
  act(() => edit.click());
}

function openRelatedEntity(document) {
  const related = document.querySelector(".related-card");
  assert.ok(related);
  act(() => related.click());
  const edit = buttonByText(document, "Edit Entity");
  assert.ok(edit);
  act(() => edit.click());
}

function assertNestedHeader(document) {
  assert.ok(headerBack(document));
  assert.ok(localeButton(document));
  assert.equal(headerButtonByText(document, "Home"), undefined);
}

test("clean Event Detail Header Back returns to Timeline without confirmation", async () => {
  const rendered = await renderApp();
  try {
    openTimeline(rendered.document);
    openEvent(rendered.document);
    assertNestedHeader(rendered.document);
    act(() => headerBack(rendered.document).click());
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
  } finally { rendered.cleanup(); }
});

test("nested Header Back and locale control coexist semantically", async () => {
  const rendered = await renderApp();
  try {
    openTimeline(rendered.document);
    openEvent(rendered.document);
    assertNestedHeader(rendered.document);
    const locale = headerButtonByText(rendered.document, "日本語");
    assert.ok(locale);
    act(() => locale.click());
    assert.ok(headerBack(rendered.document) || [...rendered.document.querySelectorAll("header button")].some((button) => button.textContent?.trim() === "戻る"));
    assert.ok(headerButtonByText(rendered.document, "English"));
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
  } finally { rendered.cleanup(); }
});

test("dirty existing Event Header Back guards and discards only after confirmation", async () => {
  const rendered = await renderApp();
  try {
    openTimeline(rendered.document);
    openEvent(rendered.document);
    const name = rendered.document.querySelector('input[placeholder="Enter event name"]');
    assert.ok(name);
    const valueSetter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(valueSetter);
    act(() => { valueSetter.call(name, "Edited Event"); name.dispatchEvent(new rendered.window.Event("input", { bubbles: true })); name.dispatchEvent(new rendered.window.Event("change", { bubbles: true })); });
    assert.ok(headerBack(rendered.document));
    act(() => headerBack(rendered.document).click());
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.ok(rendered.document.querySelector('input[placeholder="Enter event name"]'));
    const continueEditing = buttonByText(rendered.document, "Continue Editing");
    assert.ok(continueEditing);
    act(() => continueEditing.click());
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    act(() => headerBack(rendered.document).click());
    const discard = rendered.document.querySelector('[role="alertdialog"] .button-danger');
    assert.ok(discard);
    act(() => discard.click());
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
    assert.equal(rendered.document.body.textContent.includes("Edited Event"), false);
  } finally { rendered.cleanup(); }
});

test("draft Event Header Back is guarded and removes only the provisional Event", async () => {
  const rendered = await renderApp();
  try {
    openTimeline(rendered.document);
    act(() => buttonByText(rendered.document, "Add Event").click());
    assertNestedHeader(rendered.document);
    act(() => headerBack(rendered.document).click());
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    act(() => rendered.document.querySelector('[role="alertdialog"] .button-danger').click());
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.equal(rendered.document.querySelectorAll(".timeline-card").length, 1);
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
  } finally { rendered.cleanup(); }
});

test("Entity Picker and empty Entity Create Header Back are direct contextual navigation", async () => {
  const rendered = await renderApp();
  try {
    openTimeline(rendered.document);
    openEvent(rendered.document);
    act(() => buttonByText(rendered.document, "Save and Add Related Entity").click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Add Related Entity");
    assertNestedHeader(rendered.document);
    act(() => headerBack(rendered.document).click());
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    act(() => buttonByText(rendered.document, "Save and Add Related Entity").click());
    act(() => buttonByText(rendered.document, "Create New Entity").click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Create New Entity");
    assertNestedHeader(rendered.document);
    act(() => headerBack(rendered.document).click());
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Add Related Entity");
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
  } finally { rendered.cleanup(); }
});

test("clean and dirty Entity Detail Header Back preserves Event context and guards edits", async () => {
  const rendered = await renderApp();
  try {
    openTimeline(rendered.document);
    openEvent(rendered.document);
    openRelatedEntity(rendered.document);
    assert.equal(rendered.document.querySelector("h1")?.textContent, "Entity Detail");
    assertNestedHeader(rendered.document);
    act(() => headerBack(rendered.document).click());
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.ok(rendered.document.body.textContent.includes("Existing Event"));
    openRelatedEntity(rendered.document);
    const name = rendered.document.querySelector('input[placeholder="Enter a person, organization, place, or other entity"]');
    assert.ok(name);
    const valueSetter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(valueSetter);
    act(() => { valueSetter.call(name, "Edited Entity"); name.dispatchEvent(new rendered.window.Event("input", { bubbles: true })); name.dispatchEvent(new rendered.window.Event("change", { bubbles: true })); });
    act(() => headerBack(rendered.document).click());
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    assert.ok(rendered.document.querySelector('input[placeholder="Enter a person, organization, place, or other entity"]'));
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.ok(rendered.document.querySelector("h1")?.textContent === "Entity Detail");
    act(() => headerBack(rendered.document).click());
    act(() => rendered.document.querySelector('[role="alertdialog"] .button-danger').click());
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    openRelatedEntity(rendered.document);
    assert.equal(rendered.document.querySelector('input[placeholder="Enter a person, organization, place, or other entity"]')?.value, "Existing Entity");
  } finally { rendered.cleanup(); }
});

test("Coordinate-only pending Entity work guards Header Back and cancel preserves the edit", async () => {
  const rendered = await renderApp({ storedDataset: coordinateDataset });
  try {
    openTimeline(rendered.document);
    openEvent(rendered.document);
    openRelatedEntity(rendered.document);
    act(() => buttonByText(rendered.document, "Edit Recorded Coordinate").click());
    const x = rendered.document.querySelector('input[aria-label="x"]');
    assert.ok(x);
    const valueSetter = Object.getOwnPropertyDescriptor(rendered.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(valueSetter);
    act(() => { valueSetter.call(x, "99"); x.dispatchEvent(new rendered.window.Event("input", { bubbles: true })); x.dispatchEvent(new rendered.window.Event("change", { bubbles: true })); });
    act(() => headerBack(rendered.document).click());
    assert.ok(rendered.document.querySelector('[role="alertdialog"]'));
    act(() => buttonByText(rendered.document, "Continue Editing").click());
    assert.equal(rendered.document.querySelector('input[aria-label="x"]')?.value, "99");
    assert.ok(buttonByText(rendered.document, "Cancel"));
    assert.ok(buttonByText(rendered.document, "Save Coordinate"));
  } finally { rendered.cleanup(); }
});
