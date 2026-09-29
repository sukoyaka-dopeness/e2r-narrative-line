import assert from "node:assert/strict";
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
    const target = [...environment.document.querySelectorAll(".timeline-card")]
      .find((item) => item.textContent?.includes("Target"));
    assert.ok(target.textContent.includes("1 date candidate"));
    assert.ok(target.textContent.includes("----/--/--"));
    await act(async () => target.dispatchEvent(new environment.window.MouseEvent("click", { bubbles: true })));
    await act(async () => button(environment.document, "Edit").click());
    assert.ok(environment.document.querySelector(".quantitative-relative-time"));
    const before = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(before.events[1].extensions?.history, undefined);
    await act(async () => button(environment.document, "Use in History editor").click());
    const pending = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(pending.events[1].extensions?.history, undefined);
    await act(async () => button(environment.document, "Save Event").click());
    const saved = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.deepEqual(saved.events[1].extensions.history.time, { year: 2024, month: 2 });
    assert.deepEqual(saved.relations, before.relations);

    await act(async () => button(environment.document, "Edit").click());
    const panel = environment.document.querySelector(".quantitative-relative-time");
    const create = [...panel.querySelectorAll("details")]
      .find((item) => item.querySelector("summary")?.textContent === "Add quantitative assertion");
    create.open = true;
    const choices = create.querySelectorAll("select");
    await act(async () => changeSelect(environment.window, choices[0], "a"));
    await act(async () => changeSelect(environment.window, choices[1], "elapsed-offset"));
    await act(async () => create.querySelector("button").click());
    const added = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(added.relations.length, 2);
    assert.equal(added.relations[1].extensions[relativeId].type, "elapsed-offset");

    const elapsedRow = [...panel.querySelectorAll(".quantitative-relative-time__list li")]
      .find((item) => item.textContent.includes("elapsed"));
    const edit = elapsedRow.querySelector("details");
    edit.open = true;
    await act(async () => changeSelect(environment.window, edit.querySelector("select"), "before"));
    await act(async () => button(edit, "Record").click());
    const updated = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(updated.relations[1].extensions[relativeId].direction, "before");
    await act(async () => button(edit, "Delete this assertion").click());
    await act(async () => button(edit, "Confirm delete").click());
    const deleted = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(deleted.relations.length, 1);
    assert.equal(deleted.relations[0].id, "calendar");
    const calendarRow = [...panel.querySelectorAll(".quantitative-relative-time__list li")]
      .find((item) => item.textContent.includes("calendar granules"));
    const calendarEdit = calendarRow.querySelector("details");
    calendarEdit.open = true;
    await act(async () => button(calendarEdit, "Delete this assertion").click());
    await act(async () => button(calendarEdit, "Confirm delete").click());
    const empty = JSON.parse(environment.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.equal(empty.relations.length, 0);
    assert.ok(environment.document.querySelector(".quantitative-relative-time"));
  } finally {
    await server.close();
    act(() => root.unmount());
    environment.cleanup();
  }
});
