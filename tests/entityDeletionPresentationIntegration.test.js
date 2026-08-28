import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createServer } from "vite";
import { createRoot } from "react-dom/client";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";
import { getRelationBlockerLabels } from "../src/services/RelationPresentationService.ts";

const oneRelationDataset = {
  version: "1.0",
  entities: [{ id: "entity-1", name: "Alice" }],
  events: [{ id: "event-1", name: "Meeting" }],
  relations: [{ id: "relation-12345678", name: "Knows", sourceId: "event-1", targetId: "entity-1" }],
};

const parallelRelationDataset = {
  version: "1.0",
  entities: [{ id: "entity-1", name: "Alice" }],
  events: [{ id: "event-1", name: "Meeting" }],
  relations: [
    { id: "relation-12345678A", name: "Knows", sourceId: "event-1", targetId: "entity-1" },
    { id: "relation-12345678B", name: "Knows", sourceId: "event-1", targetId: "entity-1" },
  ],
};

function buttonByText(document, text) {
  return [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === text);
}

function ordinaryRemoveButtons(document) {
  return [...document.querySelectorAll(".entity-delete-connection__actions > button")]
    .filter((button) => button.textContent?.trim() === "Remove connection");
}

async function renderEntityDetail(dataset, getRelationHandoffHref = undefined) {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en");
  environment.window.localStorage.setItem("narrativeline.language", "en");
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, port: 0, strictPort: false }, appType: "custom" });
  try {
    const [{ EntityDetailScreen }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/screens/EntityDetailScreen.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);

    function Harness() {
      const [currentDataset, setCurrentDataset] = React.useState(dataset);
      return React.createElement(
        LanguageProvider,
        null,
        React.createElement(EntityDetailScreen, {
          dataset: currentDataset,
          selectedEntity: "entity-1",
          onUpdateEntity: () => {},
          onPendingWorkChange: () => {},
          onDraftChange: () => {},
          onClearDraft: () => {},
          onUpdateCoordinate: () => ({ kind: "unchanged" }),
          onDeleteEntity: () => {},
          onDeleteRelation: (relationId) => setCurrentDataset((current) => ({
            ...current,
            relations: current.relations.filter((relation) => relation.id !== relationId),
          })),
          onSelectEvent: () => {},
          onBack: () => {},
          getRelationHandoffHref,
        }),
      );
    }

    await act(async () => root.render(React.createElement(Harness)));
    return {
      environment,
      root,
      document: environment.document,
      cleanup: async () => {
        act(() => root.unmount());
        await environment.cleanup();
      },
    };
  } finally {
    await server.close();
  }
}

test("ordinary Relation actions use one local group for one and two actions", async () => {
  const rendered = await renderEntityDetail(parallelRelationDataset, (relationId) => `https://liaisonscape.test/#${relationId}`);
  try {
    await act(async () => buttonByText(rendered.document, "Delete Entity").click());
    const cards = [...rendered.document.querySelectorAll(".entity-delete-connection")];
    assert.equal(cards.length, 2);
    assert.equal(cards.every((card) => card.querySelectorAll(":scope > .entity-delete-connection__actions").length === 1), true);
    assert.deepEqual(
      cards.map((card) => card.querySelector(".entity-delete-connection__actions")?.children.length),
      [2, 2],
    );
    assert.equal(rendered.document.querySelectorAll(".entity-delete-connection__confirmation").length, 0);
    assert.equal([...rendered.document.querySelectorAll(".entity-delete-connection__handoff")].every((anchor) => anchor.getAttribute("href")?.startsWith("https://liaisonscape.test/")), true);
  } finally {
    await rendered.cleanup();
  }
});

test("blocked Entity deletion has one safe footer action and focuses it initially", async () => {
  const rendered = await renderEntityDetail(oneRelationDataset);
  try {
    await act(async () => buttonByText(rendered.document, "Delete Entity").click());
    const dialog = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(dialog);
    const keepButtons = [...dialog.querySelectorAll("button")].filter((button) => button.textContent?.trim() === "Keep Entity");
    assert.equal(keepButtons.length, 1);
    assert.equal(dialog.querySelector(".modal-actions")?.contains(keepButtons[0]), true);
    assert.equal(rendered.document.activeElement === keepButtons[0], true);
  } finally {
    await rendered.cleanup();
  }
});

test("inline Cancel restores its origin and final removal keeps a safe resolved footer focus", async () => {
  const rendered = await renderEntityDetail(parallelRelationDataset);
  try {
    await act(async () => buttonByText(rendered.document, "Delete Entity").click());
    const removeButtons = ordinaryRemoveButtons(rendered.document);
    assert.equal(removeButtons.length, 2);

    await act(async () => removeButtons[0].click());
    assert.equal(rendered.document.activeElement?.textContent, "Cancel");
    await act(async () => buttonByText(rendered.document, "Cancel").click());
    const firstRemoveAfterCancel = ordinaryRemoveButtons(rendered.document)[0];
    assert.equal(rendered.document.activeElement === firstRemoveAfterCancel, true);

    await act(async () => firstRemoveAfterCancel.click());
    await act(async () => buttonByText(rendered.document, "Remove").click());
    const surviving = ordinaryRemoveButtons(rendered.document);
    assert.equal(surviving.length, 1);
    assert.equal(rendered.document.activeElement === surviving[0], true);

    await act(async () => surviving[0].click());
    await act(async () => buttonByText(rendered.document, "Remove").click());
    const dialog = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(dialog?.textContent?.includes("All blocking connections are resolved."));
    assert.equal(dialog?.querySelectorAll(".entity-delete-connection").length, 0);
    const keep = [...dialog.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Keep Entity");
    const deleteButton = [...dialog.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Delete Entity");
    assert.ok(keep);
    assert.ok(deleteButton);
    assert.equal(rendered.document.activeElement === keep, true);
    assert.equal(rendered.document.activeElement !== deleteButton, true);
  } finally {
    await rendered.cleanup();
  }
});

test("Relation ID hints are rendered as secondary identity lines", async () => {
  const labels = getRelationBlockerLabels(parallelRelationDataset, parallelRelationDataset.relations);
  assert.equal(labels.get("relation-12345678A")?.primary, "Knows: Meeting → Alice");
  assert.equal(labels.get("relation-12345678A")?.relationIdHint, "relation-12345678A");
  assert.equal(labels.get("relation-12345678B")?.relationIdHint, "relation-12345678B");

  const rendered = await renderEntityDetail(parallelRelationDataset);
  try {
    await act(async () => buttonByText(rendered.document, "Delete Entity").click());
    assert.equal(rendered.document.querySelectorAll(".entity-delete-connection__primary").length, 2);
    assert.equal(rendered.document.querySelectorAll(".entity-delete-connection__secondary").length, 2);
    assert.deepEqual(
      [...rendered.document.querySelectorAll(".entity-delete-connection__secondary")].map((element) => element.textContent),
      ["relation-12345678A", "relation-12345678B"],
    );
  } finally {
    await rendered.cleanup();
  }
});

test("duplicate endpoint names retain endpoint hints without changing Relation ID rules", () => {
  const dataset = {
    version: "1.0",
    entities: [{ id: "entity-12345678A", name: "Alice" }, { id: "entity-12345678B", name: "Alice" }],
    events: [{ id: "event-1", name: "Meeting" }],
    relations: [
      { id: "relation-1", name: "Knows", sourceId: "event-1", targetId: "entity-12345678A" },
      { id: "relation-2", name: "Knows", sourceId: "event-1", targetId: "entity-12345678B" },
    ],
  };
  const labels = getRelationBlockerLabels(dataset, dataset.relations);
  assert.equal(labels.get("relation-1")?.primary, "Knows: Meeting → Alice (entity-12345678A)");
  assert.equal(labels.get("relation-2")?.primary, "Knows: Meeting → Alice (entity-12345678B)");
  assert.equal(labels.get("relation-1")?.relationIdHint, undefined);
  assert.equal(labels.get("relation-2")?.relationIdHint, undefined);
});
