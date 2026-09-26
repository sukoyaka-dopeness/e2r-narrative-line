import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

function datasetWithUndatedEvents() {
  return {
    version: "1.0",
    entities: [],
    events: [{ id: "event-a", name: "First" }, { id: "event-b", name: "Second" }],
    relations: [],
    extensions: { metadata: { datasetId: "relative-time-ui" } },
  };
}

function datasetWithAssertions(relations) {
  const relativeTimeId = "draft.github.sukoyaka-dopeness.relative-time";
  return {
    version: "1.0",
    entities: [],
    events: [
      { id: "a", name: "First" },
      { id: "b", name: "Second" },
      { id: "c", name: "Third" },
    ],
    relations,
    extensions: {
      metadata: { datasetId: "relative-time-ui" },
      "draft.github.sukoyaka-dopeness.specification": {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          { extension: relativeTimeId, version: "0.2.0", features: ["relative-position"] },
        ],
      },
    },
  };
}

function relativePositionRelation(id, sourceId, targetId, relation) {
  return {
    id,
    sourceId,
    targetId,
    extensions: {
      "draft.github.sukoyaka-dopeness.relative-time": {
        type: "relative-position",
        relation,
      },
    },
  };
}

async function renderAuthoring(language, initialDataset = datasetWithUndatedEvents(), eventId = "event-a") {
  const environment = createDomTestEnvironment(`https://narrativeline.test/#locale=${language}`);
  environment.document.documentElement.lang = language;
  environment.window.localStorage.setItem("narrativeline.language", language);
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
    appType: "custom",
  });
  let currentDataset;
  try {
    const [component, context, service] = await Promise.all([
      server.ssrLoadModule("/src/components/RelativeTimeAuthoringPanel.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
      server.ssrLoadModule("/src/services/RelativeTimeService.ts"),
    ]);
    const { RelativeTimeAuthoringPanel } = component;
    const { LanguageProvider, useLanguage } = context;
    const { applyRelativeTimeOperation } = service;
    function TestHarness({ dataset, setDataset }) {
      const { language, setLanguage } = useLanguage();
      return React.createElement(
        React.Fragment,
        null,
        React.createElement("button", {
          type: "button",
          "aria-label": "Toggle test language",
          onClick: () => setLanguage(language === "ja" ? "en" : "ja"),
        }, "Toggle test language"),
        React.createElement(RelativeTimeAuthoringPanel, {
          dataset,
          eventId,
          onOperation: (operation) => setDataset((current) => {
            const result = applyRelativeTimeOperation(current, operation);
            return result.ok ? result.dataset : current;
          }),
        }),
      );
    }
    function Harness() {
      const [dataset, setDataset] = React.useState(initialDataset);
      currentDataset = dataset;
      return React.createElement(
        LanguageProvider,
        null,
        React.createElement(TestHarness, { dataset, setDataset }),
      );
    }
    await act(async () => root.render(React.createElement(Harness)));
    return {
      ...environment,
      get dataset() { return currentDataset; },
      async cleanup() {
        act(() => root.unmount());
        environment.cleanup();
        await server.close();
      },
    };
  } catch (error) {
    await server.close();
    environment.cleanup();
    throw error;
  }
}

function setSelectValue(environment, select, value) {
  const setter = Object.getOwnPropertyDescriptor(
    environment.window.HTMLSelectElement.prototype,
    "value",
  )?.set;
  assert.ok(setter);
  act(() => {
    setter.call(select, value);
    select.dispatchEvent(new environment.window.Event("change", { bubbles: true }));
  });
}

function openAuthoring(environment, kind = "recorded") {
  const details = environment.document.querySelector(`.relative-time-authoring__details--${kind}`);
  assert.ok(details);
  act(() => { details.open = true; });
}

test("English authoring creates a declared assertion and does not add inverse or Timeline date data", async () => {
  const rendered = await renderAuthoring("en");
  try {
    const recordedDetails = rendered.document.querySelector(".relative-time-authoring__details--recorded");
    const createDetails = rendered.document.querySelector(".relative-time-authoring__details--create");
    assert.equal(recordedDetails?.open, false);
    assert.equal(createDetails?.open, false);
    assert.match(recordedDetails?.querySelector("summary")?.textContent ?? "", /Recorded time relations/);
    assert.match(recordedDetails?.querySelector("summary")?.textContent ?? "", /\(0\)/);
    assert.doesNotMatch(recordedDetails?.querySelector("summary")?.textContent ?? "", /optional/i);
    assert.match(createDetails?.querySelector("summary")?.textContent ?? "", /Add a new time relation \(optional\)/);
    openAuthoring(rendered, "create");
    assert.match(rendered.document.body.textContent, /Only one new relation can be added/);
    const selects = [...createDetails.querySelectorAll("select")];
    setSelectValue(rendered, selects[0], "event-b");
    const add = [...rendered.document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Add",
    );
    assert.ok(add);
    act(() => add.click());
    assert.equal(rendered.dataset.relations.length, 1);
    assert.equal(rendered.dataset.relations[0].sourceId, "event-a");
    assert.equal(rendered.dataset.relations[0].targetId, "event-b");
    assert.deepEqual(rendered.dataset.events.map(({ extensions }) => extensions), [undefined, undefined]);
    const uses = rendered.dataset.extensions["draft.github.sukoyaka-dopeness.specification"].uses;
    assert.ok(uses.some(({ extension, version, features }) =>
      extension === "draft.github.sukoyaka-dopeness.relative-time" &&
      version === "0.2.0" && features.includes("relative-position"),
    ));
    assert.match(rendered.document.body.textContent, /Added a new time relation/);
    const createStatus = createDetails?.querySelector('[role="status"]');
    assert.ok(createStatus);
    assert.match(createStatus.textContent ?? "", /Added a new time relation/);
    assert.equal(recordedDetails?.querySelector('[role="status"]'), null);
    assert.match(recordedDetails?.querySelector("summary")?.textContent ?? "", /\(1\)/);
  } finally {
    await rendered.cleanup();
  }
});

test("operation feedback follows the current presentation language", async () => {
  const rendered = await renderAuthoring("ja");
  try {
    const createDetails = rendered.document.querySelector(".relative-time-authoring__details--create");
    openAuthoring(rendered, "create");
    setSelectValue(rendered, createDetails.querySelector("select"), "event-b");
    act(() => createDetails.querySelector("button").click());
    const status = createDetails.querySelector('[role="status"]');
    assert.match(status.textContent ?? "", /新しい前後関係を追加しました/);
    act(() => rendered.document.querySelector('[aria-label="Toggle test language"]').click());
    assert.match(status.textContent ?? "", /Added a new time relation/);
    act(() => rendered.document.querySelector('[aria-label="Toggle test language"]').click());
    assert.match(status.textContent ?? "", /新しい前後関係を追加しました/);
  } finally {
    await rendered.cleanup();
  }
});

test("Event Detail separates recorded Relation edits from new assertions and keeps identity on a direction change", async () => {
  const initial = datasetWithAssertions([
    relativePositionRelation("relation-ab", "a", "b", "after"),
    relativePositionRelation("relation-bc", "b", "c", "after"),
  ]);
  const rendered = await renderAuthoring("en", initial, "b");
  try {
    const recordedDetails = rendered.document.querySelector(".relative-time-authoring__details--recorded");
    const createDetails = rendered.document.querySelector(".relative-time-authoring__details--create");
    const summary = recordedDetails?.querySelector("summary");
    assert.match(summary?.textContent ?? "", /Recorded time relations \(2\)/);
    assert.match(createDetails?.querySelector("summary")?.textContent ?? "", /Add a new time relation \(optional\)/);
    assert.equal(recordedDetails?.open, false);
    assert.equal(createDetails?.open, false);
    openAuthoring(rendered);
    assert.match(rendered.document.body.textContent, /Only one new relation can be added/i);
    const rows = [...rendered.document.querySelectorAll("[data-relative-time-relation-id]")];
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((row) => row.getAttribute("data-relative-time-relation-id")), [
      "relation-ab",
      "relation-bc",
    ]);
    assert.equal(rows[0].querySelector("span")?.textContent, "This Event is");
    assert.equal(rows[0].querySelector("select")?.value, "after");
    assert.match(rows[0].textContent, /First/);
    assert.doesNotMatch(rows[0].textContent, /Relation ID|relation-ab/);

    const direction = rows[0].querySelector("select");
    assert.ok(direction);
    setSelectValue(rendered, direction, "before");
    const save = [...rendered.document.querySelectorAll("button")].find(
      (button) => button.getAttribute("aria-label") === "Update recorded relation: Second / First",
    );
    assert.ok(save);
    act(() => save.click());

    assert.equal(rendered.dataset.relations.length, 2);
    assert.deepEqual(rendered.dataset.relations.map(({ id }) => id), ["relation-ab", "relation-bc"]);
    assert.equal(rendered.dataset.relations[0].sourceId, "a");
    assert.equal(rendered.dataset.relations[0].targetId, "b");
    assert.equal(
      rendered.dataset.relations[0].extensions["draft.github.sukoyaka-dopeness.relative-time"].relation,
      "before",
    );
    assert.equal(
      rendered.dataset.relations[1].extensions["draft.github.sukoyaka-dopeness.relative-time"].relation,
      "after",
    );
    const updateStatus = rows[0].querySelector('[role="status"]');
    assert.ok(updateStatus);
    assert.match(updateStatus.textContent ?? "", /Updated the selected recorded relation/);
    assert.equal(rows[1].querySelector('[role="status"]'), null);
    assert.equal(updateStatus.getAttribute("role"), "status");
    assert.equal(rows[0].querySelector("select")?.value, "before");
  } finally {
    await rendered.cleanup();
  }
});

test("existing-pair refusal feedback stays inside the new-relation details", async () => {
  const initial = datasetWithAssertions([
    relativePositionRelation("relation-ab", "a", "b", "after"),
  ]);
  const originalRelations = structuredClone(initial.relations);
  const rendered = await renderAuthoring("en", initial, "a");
  try {
    const recordedDetails = rendered.document.querySelector(".relative-time-authoring__details--recorded");
    const createDetails = rendered.document.querySelector(".relative-time-authoring__details--create");
    openAuthoring(rendered, "create");
    const referenceSelect = createDetails.querySelector("select");
    setSelectValue(rendered, referenceSelect, "b");
    const add = [...createDetails.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Add",
    );
    assert.ok(add);
    act(() => add.click());
    const status = createDetails.querySelector('[role="status"]');
    assert.ok(status);
    assert.match(status.textContent ?? "", /This Event pair cannot be edited/i);
    assert.equal(recordedDetails?.querySelector('[role="status"]'), null);
    assert.deepEqual(rendered.dataset.relations, originalRelations);
  } finally {
    await rendered.cleanup();
  }
});

test("contradictory recorded-update feedback stays with the changed assertion", async () => {
  const initial = datasetWithAssertions([
    relativePositionRelation("relation-ab", "a", "b", "before"),
    relativePositionRelation("relation-ba", "b", "a", "after"),
  ]);
  const originalRelations = structuredClone(initial.relations);
  const rendered = await renderAuthoring("en", initial, "a");
  try {
    openAuthoring(rendered);
    const rows = [...rendered.document.querySelectorAll("[data-relative-time-relation-id]")];
    assert.equal(rows.length, 2);
    const targetRow = rows.find((row) => row.getAttribute("data-relative-time-relation-id") === "relation-ab");
    const otherRow = rows.find((row) => row !== targetRow);
    setSelectValue(rendered, targetRow.querySelector("select"), "before");
    act(() => targetRow.querySelector("button").click());
    const status = targetRow.querySelector('[role="status"]');
    assert.ok(status);
    assert.match(status.textContent ?? "", /direct opposite assertion prevents this change/i);
    assert.equal(otherRow.querySelector('[role="status"]'), null);
    assert.deepEqual(rendered.dataset.relations, originalRelations);
  } finally {
    await rendered.cleanup();
  }
});

test("separate imported assertions for one Event pair remain separately identified in Event Detail", async () => {
  const initial = datasetWithAssertions([
    relativePositionRelation("claim-forward", "a", "b", "after"),
    relativePositionRelation("claim-reverse", "b", "a", "after"),
  ]);
  const originalRelations = structuredClone(initial.relations);
  const rendered = await renderAuthoring("en", initial, "a");
  try {
    openAuthoring(rendered);
    const rows = [...rendered.document.querySelectorAll("[data-relative-time-relation-id]")];
    assert.equal(rows.length, 2);
    assert.doesNotMatch(rows[0].textContent, /claim-forward/);
    assert.doesNotMatch(rows[1].textContent, /claim-reverse/);
    assert.deepEqual(rendered.dataset.relations, originalRelations);
  } finally {
    await rendered.cleanup();
  }
});

test("Japanese authoring localizes the first user-facing controls", async () => {
  const initial = datasetWithAssertions([
    relativePositionRelation("japanese-claim-after", "a", "b", "after"),
    relativePositionRelation("japanese-claim-before", "a", "b", "before"),
  ]);
  const rendered = await renderAuthoring("ja", initial, "b");
  try {
    const recordedDetails = rendered.document.querySelector(".relative-time-authoring__details--recorded");
    const createDetails = rendered.document.querySelector(".relative-time-authoring__details--create");
    assert.match(recordedDetails?.querySelector("summary")?.textContent ?? "", /記録済みの時間関係　2件/);
    assert.doesNotMatch(recordedDetails?.querySelector("summary")?.textContent ?? "", /任意/);
    assert.match(createDetails?.querySelector("summary")?.textContent ?? "", /新しい前後関係を追加（任意）/);
    openAuthoring(rendered);
    openAuthoring(rendered, "create");
    assert.match(rendered.document.body.textContent, /前に起こった/);
    assert.match(rendered.document.body.textContent, /後に起こった/);
    const referenceSelect = createDetails.querySelector('select[aria-label="基準にするできごと"]');
    assert.ok(referenceSelect);
    assert.match(referenceSelect.options[0].textContent ?? "", /基準にするできごとを選択/);
    const recordedRows = [...recordedDetails.querySelectorAll("[data-relative-time-relation-id]")];
    assert.equal(recordedRows.length, 2);
    assert.deepEqual(
      [...recordedRows[0].querySelectorAll(".relative-time-assertion__sentence > span")]
        .map(({ textContent }) => textContent),
      ["このできごとは", "First", "より"],
    );
    assert.equal(recordedRows[0].querySelector("select")?.value, "after");
    assert.equal(recordedRows[1].querySelector("select")?.value, "before");
    assert.doesNotMatch(rendered.document.body.textContent, /先/);
    const safetyNote = recordedDetails.querySelector(".relative-time-boundary");
    assert.deepEqual(
      [...safetyNote.querySelectorAll("span")].map(({ textContent }) => textContent),
      [
        "この記録はできごとの前後関係を保存します。",
        "日付やHistoryの順序は作成しません。",
        "各記録は個別に保持され、逆向きの記録を自動作成したり、既存記録を統合したりしません。",
      ],
    );
    const createLimit = createDetails.querySelector(".relative-time-create__boundary");
    assert.equal(createLimit.classList.contains("relative-time-boundary"), true);
    assert.ok([...rendered.document.querySelectorAll("button")].some(
      (button) => button.textContent?.trim() === "追加",
    ));
  } finally {
    await rendered.cleanup();
  }
});

test("Timeline projection exposes pairwise order and cycle fallback without rewriting Relations", async () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en");
  environment.document.documentElement.lang = "en";
  environment.window.localStorage.setItem("narrativeline.language", "en");
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
    appType: "custom",
  });
  const dataset = {
    version: "1.0",
    entities: [],
    events: [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }],
    relations: [
      { id: "ab", sourceId: "a", targetId: "b", extensions: { "draft.github.sukoyaka-dopeness.relative-time": { type: "relative-position", relation: "after" } } },
      { id: "bc", sourceId: "b", targetId: "c", extensions: { "draft.github.sukoyaka-dopeness.relative-time": { type: "relative-position", relation: "after" } } },
    ],
    extensions: {
      metadata: { datasetId: "projection-ui" },
      "draft.github.sukoyaka-dopeness.specification": {
        specVersion: "0.1.0",
        uses: [
          { extension: "metadata", version: "1.0.0" },
          { extension: "draft.github.sukoyaka-dopeness.relative-time", version: "0.2.0", features: ["relative-position"] },
        ],
      },
    },
  };
  const originalRelations = structuredClone(dataset.relations);
  try {
    const [{ RelativeTimeTimelineProjection }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/components/RelativeTimeTimelineProjection.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => root.render(React.createElement(
      LanguageProvider,
      null,
      React.createElement(RelativeTimeTimelineProjection, { dataset, onEditEvent() {} }),
    )));
    assert.match(environment.document.body.textContent, /display bands are a presentation projection/i);
    assert.match(environment.document.body.textContent, /A/);
    assert.match(environment.document.body.textContent, /C/);
    assert.deepEqual(dataset.relations, originalRelations);
  } finally {
    act(() => root.unmount());
    environment.cleanup();
    await server.close();
  }
});
