import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const relativeId = "draft.github.sukoyaka-dopeness.relative-time";
const specificationId = "draft.github.sukoyaka-dopeness.specification";

function dataset() {
  return {
    version: "1.0", entities: [],
    events: [
      { id: "a", name: "Anchor", extensions: { history: { time: { year: 2024, month: 1, day: 31 } } } },
      { id: "b", name: "Target" },
    ],
    relations: [{ id: "calendar", sourceId: "a", targetId: "b", extensions: {
      [relativeId]: { type: "calendar-granule-relation", granularity: "month", displacement: 1 },
    } }],
    extensions: { metadata: { datasetId: "quant-ui" }, [specificationId]: { specVersion: "0.1.0", uses: [
      { extension: "metadata", version: "1.0.0" },
      { extension: "history", version: "1.0.0" },
      { extension: relativeId, version: "0.2.0", features: ["calendar-granule-relation"] },
    ] } },
  };
}

function button(document, label) {
  return [...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);
}

function changeSelect(window, select, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(select, value);
  select.dispatchEvent(new window.Event("change", { bubbles: true }));
}

function changeNumber(window, input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, value);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
}

test("quantitative candidate remains supplementary until normal History save", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", JSON.stringify(dataset()));
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
    await act(async () => button(environment.document, "Continue Editing").click());
    const cards = [...environment.document.querySelectorAll(".timeline-card")];
    const anchorCard = cards.find((item) => item.querySelector(".timeline-event-name")?.textContent === "Anchor");
    const target = cards.find((item) => item.querySelector(".timeline-event-name")?.textContent === "Target");
    assert.ok(target.textContent.includes("1 date/time candidate"));
    assert.ok(target.textContent.includes("----/--/--"));
    const timelineCandidateDisclosure = target.querySelector(".timeline-time-candidate__disclosure");
    assert.ok(timelineCandidateDisclosure.querySelector("summary").textContent.includes("1 date/time candidate"));
    assert.equal(timelineCandidateDisclosure.open, false);
    assert.ok(timelineCandidateDisclosure.querySelector(".timeline-time-candidate__details"));
    await act(async () => anchorCard.dispatchEvent(new environment.window.MouseEvent("click", { bubbles: true })));
    const beforeDisclosure = environment.window.localStorage.getItem("narrativeline.lastDataset");
    assert.ok(anchorCard.classList.contains("timeline-card--selected"));
    await act(async () => timelineCandidateDisclosure.querySelector("summary").click());
    assert.equal(timelineCandidateDisclosure.open, true);
    assert.ok(anchorCard.classList.contains("timeline-card--selected"));
    assert.ok(!target.classList.contains("timeline-card--selected"));
    assert.equal(environment.window.localStorage.getItem("narrativeline.lastDataset"), beforeDisclosure);
    await act(async () => timelineCandidateDisclosure.querySelector("summary").click());
    assert.equal(timelineCandidateDisclosure.open, false);
    const summary = timelineCandidateDisclosure.querySelector("summary");
    await act(async () => {
      summary.dispatchEvent(new environment.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      summary.click();
    });
    assert.equal(timelineCandidateDisclosure.open, true);
    assert.ok(anchorCard.classList.contains("timeline-card--selected"));
    await act(async () => summary.click());
    await act(async () => target.dispatchEvent(new environment.window.MouseEvent("click", { bubbles: true })));
    assert.ok(target.classList.contains("timeline-card--selected"));
    assert.equal(timelineCandidateDisclosure.open, false);
    await act(async () => summary.click());
    assert.ok(timelineCandidateDisclosure.textContent.includes("Month precision candidate"));
    assert.ok(timelineCandidateDisclosure.textContent.includes("Not recorded · time zone and daylight saving time not evaluated"));
    assert.ok(!target.textContent.includes("[calendar]"));
    await act(async () => button(environment.document, "Edit").click());
    const initialPanel = environment.document.querySelector(".quantitative-relative-time");
    assert.equal(initialPanel.querySelector(".quantitative-relative-time__recorded h3").textContent,
      "Recorded time relations");
    assert.ok(initialPanel.querySelector(".quantitative-relative-time__candidates summary").textContent.includes(
      "Date/time candidates (not recorded)"));
    assert.equal(initialPanel.querySelector(".quantitative-relative-time__candidates").open, true);
    assert.ok(initialPanel.querySelector(".quantitative-relative-time__candidates summary").textContent.includes("1"));
    const candidateDisclosure = initialPanel.querySelector(".quantitative-relative-time__candidates");
    await act(async () => candidateDisclosure.querySelector("summary").click());
    assert.equal(candidateDisclosure.open, false);
    await act(async () => candidateDisclosure.querySelector("summary").click());
    assert.equal(candidateDisclosure.open, true);
    assert.ok(initialPanel.querySelector(".quantitative-relative-time__list").textContent.includes("the next calendar month relative to Anchor"));
    assert.ok(initialPanel.querySelector(".quantitative-relative-time__basis").textContent.includes("Anchor's recorded date/time"));
    assert.ok(initialPanel.querySelector(".quantitative-relative-time__candidates").textContent.includes("calendar month"));
    const before = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(before.events[1].extensions?.history, undefined);
    await act(async () => button(environment.document, "Review date/time").click());
    const pending = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(pending.events[1].extensions?.history, undefined);
    await act(async () => button(environment.document, "Discard Unsaved Changes and Return").click());
    const cancelled = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(cancelled.events[1].extensions?.history, undefined);
    assert.deepEqual(cancelled.relations, before.relations);
    await act(async () => button(environment.document, "Edit").click());
    await act(async () => button(environment.document, "Review date/time").click());
    await act(async () => button(environment.document, "Save Event").click());
    const saved = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.deepEqual(saved.events[1].extensions.history.time, { year: 2024, month: 2 });
    assert.deepEqual(saved.relations, before.relations);

    await act(async () => button(environment.document, "Edit").click());
    const panel = environment.document.querySelector(".quantitative-relative-time");
    const create = [...panel.querySelectorAll("details")]
      .find((item) => item.querySelector("summary")?.textContent === "Add quantitative time relation");
    create.open = true;
    const choices = create.querySelectorAll("select");
    await act(async () => changeSelect(environment.window, choices[0], "a"));
    await act(async () => changeSelect(environment.window, choices[1], "elapsed-offset"));
    assert.ok(create.querySelector(".quantitative-relative-time__fields--elapsed"));
    await act(async () => create.querySelector("button").click());
    const added = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(added.relations.length, 2);
    assert.equal(added.relations[1].extensions[relativeId].type, "elapsed-offset");

    const elapsedRow = [...panel.querySelectorAll(".quantitative-relative-time__list li")]
      .find((item) => item.textContent.includes("hour before"));
    const edit = elapsedRow.querySelector("details");
    edit.open = true;
    await act(async () => changeSelect(environment.window, edit.querySelector("select"), "before"));
    await act(async () => button(edit, "Record").click());
    const updated = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(updated.relations[1].extensions[relativeId].direction, "before");
    await act(async () => button(edit, "Delete this time relation").click());
    await act(async () => button(edit, "Confirm delete").click());
    const deleted = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(deleted.relations.length, 1);
    assert.equal(deleted.relations[0].id, "calendar");
    const calendarRow = [...panel.querySelectorAll(".quantitative-relative-time__list li")]
      .find((item) => item.textContent.includes("next calendar month"));
    const calendarEdit = calendarRow.querySelector("details");
    calendarEdit.open = true;
    const granuleDirection = calendarEdit.querySelector('select[aria-label="Before or after"]');
    assert.ok(calendarEdit.textContent.includes("on the calendar, Target is"));
    assert.equal(button(calendarEdit, "Delete this time relation").classList.contains("danger-action"), true);
    await act(async () => changeNumber(environment.window,
      calendarEdit.querySelector('input[aria-label="Number of calendar steps"]'), "3"));
    assert.equal(calendarEdit.querySelector('input[aria-label="Number of calendar steps"]').value, "3");
    await act(async () => changeSelect(environment.window, granuleDirection, "same"));
    assert.equal(calendarEdit.querySelector('input[aria-label="Number of calendar steps"]'), null);
    assert.equal(JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"))
      .relations[0].extensions[relativeId].displacement, 1);
    await act(async () => changeSelect(environment.window, granuleDirection, "after"));
    assert.equal(calendarEdit.querySelector('input[aria-label="Number of calendar steps"]').value, "3");
    await act(async () => changeSelect(environment.window, granuleDirection, "before"));
    await act(async () => button(calendarEdit, "Record").click());
    assert.equal(JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"))
      .relations[0].extensions[relativeId].displacement, -3);
    await act(async () => changeSelect(environment.window, granuleDirection, "same"));
    await act(async () => button(calendarEdit, "Record").click());
    assert.equal(JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"))
      .relations[0].extensions[relativeId].displacement, 0);
    await act(async () => changeSelect(environment.window, granuleDirection, "after"));
    assert.equal(calendarEdit.querySelector('input[aria-label="Number of calendar steps"]').value, "3");
    await act(async () => button(calendarEdit, "Record").click());
    assert.equal(JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"))
      .relations[0].extensions[relativeId].displacement, 3);
    await act(async () => button(calendarEdit, "Delete this time relation").click());
    await act(async () => button(calendarEdit, "Confirm delete").click());
    const empty = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(empty.relations.length, 0);
    assert.deepEqual(empty.events[1].extensions.history.time, { year: 2024, month: 2 });
    assert.ok(environment.document.querySelector(".quantitative-relative-time"));
  } finally {
    await server.close();
    act(() => root.unmount());
    environment.cleanup();
  }
});

test("QRT identifies same-name Events in selector, relation text, and candidate basis", async () => {
  const value = dataset();
  const longName = `Target ${"VeryLongName".repeat(12)}`;
  value.events = [
    { id: "anchor-early", name: "Anchor", extensions: { history: { time: { year: 2024, month: 1, day: 31 } } } },
    { id: "anchor-late", name: "Anchor", extensions: { history: { time: { year: 2024, month: 3, day: 1 } } } },
    { id: "undated-a-123456", name: "Undated" },
    { id: "undated-b-123456", name: "Undated" },
    { id: "target-long", name: longName },
  ];
  value.relations[0].sourceId = "anchor-early";
  value.relations[0].targetId = "target-long";
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", JSON.stringify(value));
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"), server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
    await act(async () => button(environment.document, "Continue Editing").click());
    const target = [...environment.document.querySelectorAll(".timeline-card")]
      .find((item) => item.textContent?.includes(longName));
    assert.ok(target);
    await act(async () => target.dispatchEvent(new environment.window.MouseEvent("click", { bubbles: true })));
    assert.ok(target.textContent.includes("Anchor (2024-01-31)"));
    await act(async () => button(environment.document, "Edit").click());
    const panel = environment.document.querySelector(".quantitative-relative-time");
    assert.ok(panel.querySelector(".quantitative-relative-time__list").textContent.includes("Anchor (2024-01-31)"));
    assert.ok(panel.querySelector(".quantitative-relative-time__basis").textContent.includes("Anchor (2024-01-31)"));
    const edit = panel.querySelector(".quantitative-relative-time__list details");
    edit.open = true;
    assert.ok(edit.textContent.includes(longName));
    assert.ok(edit.textContent.includes("Anchor (2024-01-31)"));
    const create = [...panel.querySelectorAll("details")]
      .find((item) => item.querySelector("summary")?.textContent === "Add quantitative time relation");
    create.open = true;
    const options = [...create.querySelector("select").options];
    assert.equal(options.find(({ value: id }) => id === "anchor-early").textContent, "Anchor (2024-01-31)");
    assert.equal(options.find(({ value: id }) => id === "anchor-late").textContent, "Anchor (2024-03-01)");
    assert.equal(options.find(({ value: id }) => id === "undated-a-123456").textContent, "Undated (undated-a)");
    assert.equal(options.find(({ value: id }) => id === "undated-b-123456").textContent, "Undated (undated-b)");
    assert.ok(!options.some(({ textContent }) => textContent?.includes("undated-a-123456")));
  } finally {
    await server.close();
    act(() => root.unmount());
    environment.cleanup();
  }
});

test("acceptance fixture keeps Recorded Timeline placement and all candidate entries", async () => {
  const source = readFileSync(new URL("./fixtures/quantitative-relative-time-human-acceptance.e2r.json", import.meta.url), "utf8");
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.window.localStorage.setItem("narrativeline.language", "en");
  environment.window.localStorage.setItem("narrativeline.lastDataset", source);
  environment.window.scrollTo = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"), server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
    await act(async () => button(environment.document, "Continue Editing").click());
    const cards = [...environment.document.querySelectorAll(".timeline-card")];
    const recorded = cards.find((item) => item.querySelector(".timeline-event-name")?.textContent === "Recorded event with an additional candidate");
    const dense = cards.find((item) => item.querySelector(".timeline-event-name")?.textContent?.startsWith("A very long event name"));
    assert.equal(recorded.querySelector(".timeline-card__row > div:first-child > div")?.textContent, "2024-02-05");
    assert.ok(recorded.querySelector(".timeline-time-candidate summary")?.textContent.includes("1 date/time candidate"));
    const disclosure = dense.querySelector(".timeline-time-candidate__disclosure");
    assert.ok(disclosure.querySelector("summary").textContent.includes("6 date/time candidates"));
    assert.equal(disclosure.open, false);
    await act(async () => disclosure.querySelector("summary").click());
    assert.equal(disclosure.querySelectorAll(".timeline-time-candidate__values li").length, 6);
    assert.deepEqual(JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset")), JSON.parse(source));
  } finally {
    await server.close();
    act(() => root.unmount());
    environment.cleanup();
  }
});
