import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { importDatasetJson } from "../src/services/DatasetService.ts";
import { formatEventIdentityLabel, getEventIdentityChronology, resolveEventIdentityPresentations } from "../src/services/EventIdentityPresentationService.ts";
import { getQuantitativeTimeCandidates } from "../src/services/QuantitativeTimeCandidateService.ts";
import { quantitativeRelationLabel } from "../src/services/QuantitativeTimePresentationService.ts";

const fixture = new URL("./fixtures/quantitative-relative-time-human-acceptance.e2r.json", import.meta.url);
const relativeId = "draft.github.sukoyaka-dopeness.relative-time";

test("local QRT acceptance fixture imports and keeps direct candidates separate", () => {
  const result = importDatasetJson(readFileSync(fixture, "utf8"));
  assert.equal(result.isValid, true, JSON.stringify(result.issues));
  assert.deepEqual(result.issues, []);
  const dataset = result.dataset;
  const dense = getQuantitativeTimeCandidates(dataset, "target-many");
  assert.deepEqual(dense.map(({ relationId, date }) => ({ relationId, date })), [
    { relationId: "calendar-plus-one-day", date: { year: 2024, month: 2, day: 1 } },
    { relationId: "calendar-minus-two-days", date: { year: 2024, month: 2, day: 1 } },
    { relationId: "calendar-same-month", date: { year: 2024, month: 2 } },
    { relationId: "elapsed-two-hours", date: { year: 2024, month: 2, day: 1, hour: 1, minute: 0 } },
    { relationId: "twin-calendar-one-day", date: { year: 2024, month: 2, day: 1 } },
    { relationId: "twin-calendar-two-days", date: { year: 2024, month: 2, day: 2 } },
  ]);
  assert.deepEqual(getQuantitativeTimeCandidates(dataset, "reverse-source").map(({ date }) => date),
    [{ year: 2024, month: 2, day: 29 }]);
  assert.deepEqual(getQuantitativeTimeCandidates(dataset, "target-one").map(({ date }) => date),
    [{ year: 2024, month: 2 }]);
  assert.deepEqual(dataset.relations.find(({ id }) => id === "single-calendar-next-month").extensions[relativeId],
    { type: "calendar-granule-relation", granularity: "month", displacement: 1 });
  assert.deepEqual(getQuantitativeTimeCandidates(dataset, "recorded-target").map(({ date }) => date),
    [{ year: 2024, month: 2, day: 1 }]);
  assert.deepEqual(dataset.events.find(({ id }) => id === "recorded-target").extensions.history.time,
    { year: 2024, month: 2, day: 5 });
});

test("fixture supports source and target wording and existing name disambiguation", () => {
  const result = importDatasetJson(readFileSync(fixture, "utf8"));
  assert.equal(result.isValid, true);
  const dataset = result.dataset;
  const payload = (relationId) => dataset.relations.find(({ id }) => id === relationId).extensions[relativeId];
  assert.equal(quantitativeRelationLabel(payload("calendar-plus-one-day"), true, "Anchor", "ja"), "Anchor の次の日");
  assert.ok(quantitativeRelationLabel(payload("calendar-plus-one-day"), false, "Target", "ja").includes("前の日"));
  assert.equal(quantitativeRelationLabel(payload("calendar-minus-two-days"), true, "Anchor", "ja"), "Anchor の日付から2つ前の日");
  assert.ok(quantitativeRelationLabel(payload("calendar-minus-two-days"), false, "Target", "ja").includes("2つ後の日"));
  assert.equal(quantitativeRelationLabel(payload("calendar-same-month"), true, "Month anchor", "ja"), "Month anchor と同じ月");
  assert.equal(quantitativeRelationLabel(payload("calendar-same-month"), false, "Target", "ja"), "Target と同じ月");
  assert.equal(quantitativeRelationLabel(payload("elapsed-two-hours"), true, "Anchor", "en"), "2 hours after Anchor");
  assert.equal(quantitativeRelationLabel(payload("elapsed-two-hours"), false, "Target", "en"), "2 hours before Target");

  const identities = resolveEventIdentityPresentations(dataset.events, {
    getPrimary: (event) => event.name,
    getChronology: getEventIdentityChronology,
  });
  assert.notEqual(formatEventIdentityLabel(identities.get("anchor-jan31")), formatEventIdentityLabel(identities.get("anchor-feb03")));
  assert.ok(identities.get("anchor-jan31").chronologyHint);
  const twinA = identities.get("twin-anchor-a-123456");
  const twinB = identities.get("twin-anchor-b-123456");
  assert.equal(twinA.needsShortId, true);
  assert.equal(twinB.needsShortId, true);
  assert.notEqual(twinA.shortIdHint, twinB.shortIdHint);
  assert.ok(!formatEventIdentityLabel(twinA).includes(twinA.eventId));
});

test("direct candidate direction reverses when the target supplies Recorded History", () => {
  const result = importDatasetJson(readFileSync(fixture, "utf8"));
  assert.equal(result.isValid, true);
  const dataset = structuredClone(result.dataset);
  dataset.events.find(({ id }) => id === "target-many").extensions = {
    history: { time: { year: 2024, month: 3, day: 1, hour: 2, minute: 0 } },
  };
  const candidateFrom = (eventId, relationId) => getQuantitativeTimeCandidates(dataset, eventId)
    .find((candidate) => candidate.relationId === relationId)?.date;
  assert.deepEqual(candidateFrom("anchor-jan31", "calendar-plus-one-day"),
    { year: 2024, month: 2, day: 29 });
  assert.deepEqual(candidateFrom("anchor-feb03", "calendar-minus-two-days"),
    { year: 2024, month: 3, day: 3 });
  assert.deepEqual(candidateFrom("anchor-feb19", "calendar-same-month"),
    { year: 2024, month: 3 });
  assert.deepEqual(candidateFrom("anchor-jan31", "elapsed-two-hours"),
    { year: 2024, month: 3, day: 1, hour: 0, minute: 0 });
});
