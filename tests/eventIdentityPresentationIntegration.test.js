import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createServer } from "vite";
import { createRoot } from "react-dom/client";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

function historyEvent(id, name, year, day, hour, temporalOrder) {
  return {
    id,
    name,
    extensions: {
      history: {
        time: {
          year,
          month: 8,
          day,
          ...(hour === undefined ? {} : { hour, minute: 0 }),
          ...(temporalOrder === undefined ? {} : { temporalOrder }),
        },
      },
    },
  };
}

function history2ApproximateEvent(id, name, year, day, hour, minute) {
  return {
    id,
    name,
    extensions: {
      history: {
        assertions: [{
          id: `history-position-${id}`,
          type: "position",
          position: {
            year,
            month: 8,
            day,
            hour,
            minute,
            approximation: "circa",
          },
        }],
      },
    },
  };
}

async function renderTimeline(dataset, language = "en") {
  const environment = createDomTestEnvironment(`https://narrativeline.test/#locale=${language}`);
  environment.document.documentElement.lang = language;
  environment.window.localStorage.setItem("narrativeline.language", language);
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const selectedIds = [];
  const editedIds = [];
  let setSelectedEvent;
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, port: 0, strictPort: false },
    appType: "custom",
  });

  try {
    const [{ TimelineScreen }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/screens/TimelineScreen.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);

    function Harness() {
      const [selectedEvent, setCurrentSelectedEvent] = React.useState(null);
      setSelectedEvent = setCurrentSelectedEvent;
      return React.createElement(
        LanguageProvider,
        null,
        React.createElement(TimelineScreen, {
          dataset,
          datasetModified: false,
          selectedEvent,
          onSelectEvent: (eventId) => {
            selectedIds.push(eventId);
            setCurrentSelectedEvent(eventId);
          },
          onEditEvent: (eventId) => editedIds.push(eventId),
          onAddEvent: () => {},
          onImportDataset: () => ({ isValid: true, issues: [] }),
          onExportDataset: () => ({ isValid: true, issues: [], json: "{}" }),
          onUpdateDatasetTitle: () => {},
        }),
      );
    }

    await act(async () => root.render(React.createElement(Harness)));
  } finally {
    await server.close();
  }

  return {
    document: environment.document,
    selectedIds,
    editedIds,
    selectEvent(eventId) {
      act(() => setSelectedEvent(eventId));
    },
    async cleanup() {
      act(() => root.unmount());
      await environment.cleanup();
    },
  };
}

async function renderEntityDetail(dataset, language = "en") {
  const environment = createDomTestEnvironment(`https://narrativeline.test/#locale=${language}`);
  environment.document.documentElement.lang = language;
  environment.window.localStorage.setItem("narrativeline.language", language);
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const selectedIds = [];
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, port: 0, strictPort: false },
    appType: "custom",
  });

  try {
    const [{ EntityDetailScreen }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/screens/EntityDetailScreen.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);

    await act(async () => {
      root.render(React.createElement(
        LanguageProvider,
        null,
        React.createElement(EntityDetailScreen, {
          dataset,
          selectedEntity: "entity-1",
          onUpdateEntity: () => {},
          onPendingWorkChange: () => {},
          onDraftChange: () => {},
          onClearDraft: () => {},
          onUpdateCoordinate: () => ({ kind: "unchanged" }),
          onDeleteEntity: () => {},
          onDeleteRelation: () => {},
          onSelectEvent: (eventId) => selectedIds.push(eventId),
          onBack: () => {},
        }),
      ));
    });
  } finally {
    await server.close();
  }

  return {
    document: environment.document,
    selectedIds,
    async cleanup() {
      act(() => root.unmount());
      await environment.cleanup();
    },
  };
}

function relatedDataset(events) {
  return {
    version: "1.0",
    entities: [{ id: "entity-1", name: "Subject" }],
    events,
    relations: events
      .filter((event) => event.related)
      .map((event) => ({
        id: `relation-${event.id}`,
        sourceId: event.id,
        targetId: "entity-1",
      })),
  };
}

const emptyRelations = { entities: [], relations: [] };

test("T1 unique Timeline names have no identity clutter", async () => {
  const rendered = await renderTimeline({
    version: "1.0",
    ...emptyRelations,
    events: [historyEvent("event-unique", "Inspection", 2026, 28)],
  });
  try {
    assert.equal(rendered.document.querySelectorAll(".timeline-event-identity-hint").length, 0);
    assert.deepEqual(
      [...rendered.document.querySelectorAll(".timeline-event-name")].map((node) => node.textContent),
      ["Inspection"],
    );
  } finally {
    await rendered.cleanup();
  }
});

test("T2 distinct chronology does not duplicate Timeline chronology", async () => {
  const rendered = await renderTimeline({
    version: "1.0",
    ...emptyRelations,
    events: [
      historyEvent("event-first", "Inspection", 2026, 28, 9),
      historyEvent("event-second", "Inspection", 2026, 29, 9),
    ],
  });
  try {
    assert.equal(rendered.document.querySelectorAll(".timeline-event-identity-hint").length, 0);
    assert.equal(rendered.document.querySelectorAll(".timeline-event-time").length, 2);
  } finally {
    await rendered.cleanup();
  }
});

test("H2 circa Timeline preserves recorded time in EN and JA", async () => {
  const dataset = {
    version: "1.0",
    ...emptyRelations,
    events: [
      history2ApproximateEvent("event-circa", "Approximate inspection", 2026, 28, 9, 5),
      history2ApproximateEvent("event-circa-2", "Second approximate inspection", 2026, 29, 20, 0),
    ],
    extensions: {
      "draft.github.sukoyaka-dopeness.specification": {
        specVersion: "1.0.0",
        uses: [{ extension: "history", version: "2.0.0", features: ["approximation"] }],
      },
    },
  };

  for (const language of ["en", "ja"]) {
    const rendered = await renderTimeline(dataset, language);
    try {
      assert.equal(rendered.document.querySelectorAll(".timeline-event-time").length, 2);
      assert.deepEqual(
        [...rendered.document.querySelectorAll(".timeline-event-time")].map((node) => node.textContent),
        language === "ja" ? ["09時05分", "20時00分"] : ["09h 05m", "20h 00m"],
      );
    } finally {
      await rendered.cleanup();
    }
  }
});

test("T3 equal chronology shows distinct short-ID hints", async () => {
  const rendered = await renderTimeline({
    version: "1.0",
    ...emptyRelations,
    events: [
      historyEvent("event-123456A", "Inspection", 2026, 28),
      historyEvent("event-123456B", "Inspection", 2026, 28),
    ],
  });
  try {
    const hints = [...rendered.document.querySelectorAll(".timeline-event-identity-hint")].map((node) => node.textContent);
    assert.equal(hints.length, 2);
    assert.notEqual(hints[0], hints[1]);
    assert.equal(hints.every((hint) => (hint?.length ?? 0) >= 8), true);
  } finally {
    await rendered.cleanup();
  }
});

test("T4 Timeline selection and edit keep the exact full Event ID", async () => {
  const eventId = "event-canonical-123456";
  const rendered = await renderTimeline({
    version: "1.0",
    ...emptyRelations,
    events: [historyEvent(eventId, "Inspection", 2026, 28)],
  });
  try {
    const card = rendered.document.querySelector(".timeline-card");
    assert.ok(card);
    await act(async () => card.click());
    assert.deepEqual(rendered.selectedIds, [eventId]);
    await act(async () => card.querySelector("button")?.click());
    assert.deepEqual(rendered.editedIds, [eventId]);
  } finally {
    await rendered.cleanup();
  }
});

test("T5 existing Timeline chronology order remains unchanged", async () => {
  const rendered = await renderTimeline({
    version: "1.0",
    ...emptyRelations,
    events: [
      historyEvent("event-late", "Late", 2026, 29),
      historyEvent("event-early", "Early", 2026, 28),
    ],
  });
  try {
    assert.deepEqual(
      [...rendered.document.querySelectorAll(".timeline-event-name")].map((node) => node.textContent),
      ["Early", "Late"],
    );
  } finally {
    await rendered.cleanup();
  }
});

test("T6 temporalOrder is not rendered as identity text", async () => {
  const rendered = await renderTimeline({
    version: "1.0",
    ...emptyRelations,
    events: [
      historyEvent("event-order-one", "Inspection", 2026, 28, undefined, 1),
      historyEvent("event-order-two", "Inspection", 2026, 28, undefined, 2),
    ],
  });
  try {
    assert.equal(rendered.document.querySelectorAll(".timeline-event-identity-hint").length, 2);
    assert.equal(
      [...rendered.document.querySelectorAll(".timeline-event-identity-hint")].some((node) => node.textContent === "1" || node.textContent === "2"),
      false,
    );
  } finally {
    await rendered.cleanup();
  }
});

test("E1 an unrelated Dataset Event does not add Related Events clutter", async () => {
  const rendered = await renderEntityDetail(relatedDataset([
    { ...historyEvent("event-related", "Inspection", 2026, 28), related: true },
    historyEvent("event-unrelated", "Inspection", 2026, 29),
  ]));
  try {
    assert.equal(rendered.document.querySelectorAll(".related-card").length, 1);
    assert.equal(rendered.document.querySelectorAll(".related-card__identity-hint").length, 0);
  } finally {
    await rendered.cleanup();
  }
});

test("E2 duplicate Related Events with distinct chronology show chronology", async () => {
  const rendered = await renderEntityDetail(relatedDataset([
    { ...historyEvent("event-first", "Inspection", 2026, 28, 9), related: true },
    { ...historyEvent("event-second", "Inspection", 2026, 29, 9), related: true },
  ]));
  try {
    assert.deepEqual(
      [...rendered.document.querySelectorAll(".related-card__identity-hint")].map((node) => node.textContent),
      ["2026-08-28 09:00", "2026-08-29 09:00"],
    );
  } finally {
    await rendered.cleanup();
  }
});

test("E3 duplicate Related Events with equal chronology show chronology and short IDs", async () => {
  const rendered = await renderEntityDetail(relatedDataset([
    { ...historyEvent("event-123456A", "Inspection", 2026, 28), related: true },
    { ...historyEvent("event-123456B", "Inspection", 2026, 28), related: true },
  ]));
  try {
    const hints = [...rendered.document.querySelectorAll(".related-card__identity-hint")].map((node) => node.textContent);
    assert.equal(hints.filter((hint) => hint === "2026-08-28").length, 2);
    assert.equal(hints.filter((hint) => hint?.startsWith("event-")).length, 2);
    assert.notEqual(hints[1], hints[3]);
  } finally {
    await rendered.cleanup();
  }
});

test("E4 an outside same-name Event does not trigger a Related Events hint", async () => {
  const rendered = await renderEntityDetail(relatedDataset([
    { ...historyEvent("event-related", "Inspection", 2026, 28), related: true },
    historyEvent("event-outside", "Inspection", 2026, 28),
  ]));
  try {
    assert.equal(rendered.document.querySelectorAll(".related-card__identity-hint").length, 0);
  } finally {
    await rendered.cleanup();
  }
});

test("E5 Related Events selection keeps the exact full Event ID", async () => {
  const eventId = "event-canonical-123456";
  const rendered = await renderEntityDetail(relatedDataset([
    { ...historyEvent(eventId, "Inspection", 2026, 28), related: true },
  ]));
  try {
    const card = rendered.document.querySelector(".related-card");
    assert.ok(card);
    await act(async () => card.click());
    await act(async () => card.querySelector("button")?.click());
    assert.deepEqual(rendered.selectedIds, [eventId]);
  } finally {
    await rendered.cleanup();
  }
});

test("E6 EN and JA use the same ambiguity decisions", async () => {
  const events = [
    { ...historyEvent("event-123456A", "Inspection", 2026, 28), related: true },
    { ...historyEvent("event-123456B", "Inspection", 2026, 28), related: true },
  ];
  const english = await renderEntityDetail(relatedDataset(events), "en");
  const englishHints = [...english.document.querySelectorAll(".related-card__identity-hint")].map((node) => node.textContent);
  await english.cleanup();
  const japanese = await renderEntityDetail(relatedDataset(events), "ja");
  try {
    const japaneseHints = [...japanese.document.querySelectorAll(".related-card__identity-hint")].map((node) => node.textContent);
    assert.equal(englishHints.length, japaneseHints.length);
    assert.equal(englishHints.filter((hint) => hint?.startsWith("event-")).length, 2);
    assert.equal(japaneseHints.filter((hint) => hint?.startsWith("event-")).length, 2);
  } finally {
    await english.cleanup();
    await japanese.cleanup();
  }
});

test("E7 Related Events retain existing recorded chronology formatting", async () => {
  const rendered = await renderEntityDetail(relatedDataset([
    { ...historyEvent("event-first", "Inspection", 1969, 16, 9), related: true },
    { ...historyEvent("event-second", "Inspection", 1969, 16, 10), related: true },
  ]));
  try {
    const text = rendered.document.querySelector(".related-card__identity-hint")?.textContent;
    assert.equal(text, "1969-08-16 09:00");
    assert.equal(text?.includes("Precision"), false);
    assert.equal(text?.includes("temporalOrder"), false);
  } finally {
    await rendered.cleanup();
  }
});
