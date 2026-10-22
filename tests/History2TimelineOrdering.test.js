import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { compareEventsByHistoryDate } from "../src/services/HistoryService.ts";
import { getPerspectiveTimeline } from "../src/services/PerspectiveOrderingService.ts";

const perspectiveId = "draft.github.sukoyaka-dopeness.perspective";
const specificationId = "draft.github.sukoyaka-dopeness.specification";

function history2Event(id, position, temporalOrder) {
  return {
    id,
    extensions: {
      history: {
        assertions: [{
          id: "time-1",
          type: "position",
          position,
          ...(temporalOrder === undefined ? {} : { temporalOrder }),
        }],
      },
    },
  };
}

function history2Dataset(events, eventOrder) {
  return {
    version: "1.0",
    entities: [],
    events,
    relations: [],
    extensions: {
      [specificationId]: {
        specVersion: "0.1.0",
        uses: [
          { extension: "history", version: "2.0.0" },
          ...(eventOrder === undefined ? [] : [{ extension: perspectiveId, version: "0.1.0" }]),
        ],
      },
      ...(eventOrder === undefined ? {} : {
        [perspectiveId]: { perspectives: { main: { name: "Display order", eventOrder } } },
      }),
    },
  };
}

function timelineIds(dataset) {
  return getPerspectiveTimeline(dataset).events.map((event) => event.id);
}

test("Berlin Wall EN/JA History 2 positions sort by recorded same-day clock time", async () => {
  for (const locale of ["en", "ja"]) {
    const json = await readFile(new URL(`../src/sample/berlin-wall-history.${locale}.e2r.json`, import.meta.url), "utf8");
    const dataset = JSON.parse(json);
    const ids = new Set(["travel-announcement", "ard-report", "first-crossing"]);
    assert.deepEqual(timelineIds(dataset).filter((id) => ids.has(id)), [
      "travel-announcement", "ard-report", "first-crossing",
    ], locale);
  }
});

test("History 2 compares hour, minute, second, and recorded granularity without inventing missing fields", () => {
  const day = { year: 2026, month: 10, day: 22 };
  const dataset = history2Dataset([
    history2Event("a-second", { ...day, hour: 9, minute: 5, second: 7 }),
    history2Event("b-minute-late", { ...day, hour: 9, minute: 6 }),
    history2Event("c-hour-late", { ...day, hour: 10 }),
    history2Event("d-minute", { ...day, hour: 9, minute: 5 }),
    history2Event("e-hour", { ...day, hour: 9 }),
    history2Event("f-day", day),
    history2Event("g-second-early", { ...day, hour: 9, minute: 5, second: 2 }),
  ]);
  assert.deepEqual(timelineIds(dataset), [
    "f-day", "e-hour", "d-minute", "g-second-early", "a-second",
    "b-minute-late", "c-hour-late",
  ]);
});

test("History 2 compares the recorded date before time and preserves temporalOrder and ID fallback", () => {
  const day = { year: 2026, month: 10, day: 22 };
  const dataset = history2Dataset([
    history2Event("z-earlier", { ...day, hour: 18, minute: 53 }, 20),
    history2Event("a-later", { ...day, hour: 20 }, 10),
    history2Event("b-next-day", { ...day, day: 23, hour: 0, minute: 1 }),
    history2Event("z-tie", { ...day, hour: 21 }, 2),
    history2Event("a-tie", { ...day, hour: 21 }, 1),
    history2Event("c-id", { ...day, hour: 22 }),
    history2Event("b-id", { ...day, hour: 22 }),
  ]);
  assert.deepEqual(timelineIds(dataset), [
    "z-earlier", "a-later", "a-tie", "z-tie", "b-id", "c-id", "b-next-day",
  ]);
});

test("undated Events and unsupported multiple History 2 assertions keep the existing fallback", () => {
  const day = { year: 2026, month: 10, day: 22 };
  const multiple = history2Event("b-multiple", { ...day, hour: 8 });
  multiple.extensions.history.assertions.push({
    id: "time-2", type: "position", position: { ...day, hour: 10 },
  });
  const dataset = history2Dataset([
    multiple,
    { id: "z-undated" },
    { id: "a-undated" },
    history2Event("c-dated", { ...day, hour: 9 }),
  ]);
  dataset.extensions[specificationId].uses[0].features = ["multiple-assertions"];
  assert.deepEqual(timelineIds(dataset), [
    "c-dated", "a-undated", "b-multiple", "z-undated",
  ]);
});

test("History 1 clock comparison and an authored Perspective display order remain independent", () => {
  const early = { id: "z-early", extensions: { history: { time: { year: 2026, month: 10, day: 22, hour: 9 } } } };
  const late = { id: "a-late", extensions: { history: { time: { year: 2026, month: 10, day: 22, hour: 10 } } } };
  assert.ok(compareEventsByHistoryDate(early, late) < 0);

  const day = { year: 2026, month: 10, day: 22 };
  const dataset = history2Dataset([
    history2Event("z-early", { ...day, hour: 9 }),
    history2Event("a-late", { ...day, hour: 10 }),
  ], ["a-late", "z-early"]);
  assert.deepEqual(timelineIds(dataset), ["a-late", "z-early"]);
  assert.deepEqual(getPerspectiveTimeline(dataset).diagnostics, [
    { kind: "history", eventIds: ["a-late", "z-early"] },
  ]);
});
