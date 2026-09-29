import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarDisplacementFromInput,
  formatQuantitativeCandidateForDisplay,
  quantitativeCandidateBasis,
  quantitativeRelationLabel,
} from "../src/services/QuantitativeTimePresentationService.ts";

const month = { type: "calendar-granule-relation", granularity: "month", displacement: 1 };
const elapsed = { type: "elapsed-offset", direction: "after", value: 2, unit: "hour" };

test("relation wording follows the viewed Event without changing the stored orientation", () => {
  assert.equal(quantitativeRelationLabel(month, true, "Anchor", "en"), "the next calendar month relative to Anchor");
  assert.equal(quantitativeRelationLabel(month, false, "Anchor", "ja"), "Anchor の前の月");
  assert.equal(quantitativeRelationLabel({ ...month, displacement: 0 }, true, "Anchor", "ja"), "Anchor と同じ月");
  assert.equal(quantitativeRelationLabel({ ...month, displacement: 2 }, true, "Anchor", "ja"), "Anchor の月から2つ後の月");
  assert.equal(quantitativeRelationLabel({ ...month, displacement: -2 }, true, "Anchor", "ja"), "Anchor の月から2つ前の月");
  assert.equal(quantitativeRelationLabel({ ...month, displacement: 0 }, true, "Anchor", "en"), "The same calendar month as Anchor");
  assert.equal(quantitativeRelationLabel({ ...month, displacement: 2 }, true, "Anchor", "en"), "2 month steps later on the calendar than Anchor");
  assert.equal(quantitativeRelationLabel({ type: "calendar-granule-relation", granularity: "hour", displacement: 1 }, true, "Anchor", "ja"), "Anchor の時単位では次の時");
  assert.equal(quantitativeRelationLabel(elapsed, true, "Anchor", "en"), "2 hours after Anchor");
  assert.equal(quantitativeRelationLabel(elapsed, false, "Anchor", "en"), "2 hours before Anchor");
  assert.equal(quantitativeRelationLabel(elapsed, false, "Anchor", "ja"), "Anchor の2時間前");
  assert.equal(month.displacement, 1);
  assert.equal(elapsed.direction, "after");
});

test("calendar movement stays a granule step and candidates show their precision", () => {
  assert.equal(calendarDisplacementFromInput(2, "before"), -2);
  assert.equal(calendarDisplacementFromInput(2, "after"), 2);
  assert.equal(calendarDisplacementFromInput(2, "same"), 0);
  assert.equal(quantitativeRelationLabel({ type: "calendar-granule-relation", granularity: "day", displacement: 1 }, true, "Target B", "ja"), "Target B の次の日");
  assert.equal(quantitativeRelationLabel({ type: "calendar-granule-relation", granularity: "day", displacement: -1 }, true, "Target B", "ja"), "Target B の前の日");
  assert.equal(quantitativeRelationLabel({ type: "calendar-granule-relation", granularity: "day", displacement: 2 }, true, "Target B", "ja"), "Target B の日付から2つ後の日");
  assert.equal(quantitativeRelationLabel({ type: "calendar-granule-relation", granularity: "year", displacement: 1 }, true, "Target B", "ja"), "Target B の次の年");
  const twoYears = { type: "calendar-granule-relation", granularity: "year", displacement: 2 };
  assert.equal(quantitativeRelationLabel(twoYears, true, "Anchor", "en"),
    "2 year steps later on the calendar than Anchor");
  assert.equal(quantitativeCandidateBasis(month, true, "Anchor", "en"),
    "Calculated from Anchor's recorded date/time and “the next calendar month”.");
  assert.deepEqual(formatQuantitativeCandidateForDisplay({ year: 2024, month: 2 }, "ja"),
    { value: "2024年2月", precision: "月単位の候補" });
  assert.deepEqual(formatQuantitativeCandidateForDisplay({ year: 2024, month: 2 }, "en"),
    { value: "2024-02", precision: "Month precision candidate" });
  assert.deepEqual(formatQuantitativeCandidateForDisplay({ year: 2024, month: 2, day: 1, hour: 1, minute: 0 }, "en"),
    { value: "2024-02-01 01:00", precision: undefined });
});
