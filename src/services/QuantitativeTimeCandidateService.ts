import type { Dataset } from "../models/Dataset";
import type { Event } from "../models/Event";
import type { HistoryDate } from "./HistoryService.ts";
import { getEventHistoryTime, validateHistoryDate } from "./HistoryService.ts";
import { getHistory2PositionEditorValues } from "./History2Service.ts";
import { getQuantitativeRelations, type Granularity, type QuantitativePayload } from "./QuantitativeRelativeTimeService.ts";

export type QuantitativeTimeCandidate = {
  relationId: string;
  anchorEventId: string;
  eventId: string;
  date: HistoryDate;
  payload: QuantitativePayload;
};

export function formatQuantitativeCandidateDate(date: HistoryDate): string {
  const day = [date.year, date.month, date.day].filter((value) => value !== undefined);
  const time = [date.hour, date.minute, date.second].filter((value) => value !== undefined);
  return day.join("-") + (time.length
    ? ` ${time.map((value) => String(value).padStart(2, "0")).join(":")}`
    : "");
}

const fields: Array<keyof HistoryDate> = ["year", "month", "day", "hour", "minute", "second"];

function precision(date: HistoryDate): number {
  for (let index = fields.length - 1; index >= 0; index -= 1) {
    if (date[fields[index]] !== undefined) return index;
  }
  return -1;
}

function dateAt(date: HistoryDate, level: number): HistoryDate {
  const result: HistoryDate = {};
  for (let index = 0; index <= level; index += 1) {
    const value = date[fields[index]];
    if (value !== undefined) result[fields[index]] = value;
  }
  return result;
}

function asUtc(date: HistoryDate): Date | undefined {
  if (date.year === undefined || date.year < -271820 || date.year > 275759) return undefined;
  const value = new Date(0);
  value.setUTCFullYear(date.year, (date.month ?? 1) - 1, date.day ?? 1);
  value.setUTCHours(date.hour ?? 0, date.minute ?? 0, date.second ?? 0, 0);
  return Number.isFinite(value.getTime()) ? value : undefined;
}

function fromUtc(value: Date, level: number): HistoryDate {
  return dateAt({
    year: value.getUTCFullYear(), month: value.getUTCMonth() + 1,
    day: value.getUTCDate(), hour: value.getUTCHours(),
    minute: value.getUTCMinutes(), second: value.getUTCSeconds(),
  }, level);
}

function shiftGranule(date: HistoryDate, granularity: Granularity, displacement: number): HistoryDate | undefined {
  const level = fields.indexOf(granularity);
  if (precision(date) < level) return undefined;
  if (granularity === "year") return { year: (date.year as number) + displacement };
  if (granularity === "month") {
    const monthIndex = (date.year as number) * 12 + (date.month as number) - 1 + displacement;
    return { year: Math.floor(monthIndex / 12), month: ((monthIndex % 12) + 12) % 12 + 1 };
  }
  const value = asUtc(dateAt(date, level));
  if (!value) return undefined;
  const milliseconds = { day: 86400000, hour: 3600000, minute: 60000, second: 1000 }[granularity];
  const shifted = new Date(value.getTime() + displacement * milliseconds);
  return Number.isFinite(shifted.getTime()) ? fromUtc(shifted, level) : undefined;
}

function shiftElapsed(date: HistoryDate, payload: Extract<QuantitativePayload, { type: "elapsed-offset" }>, inverse: boolean): HistoryDate | undefined {
  const level = fields.indexOf(payload.unit);
  if (precision(date) < level) return undefined;
  const value = asUtc(date);
  if (!value) return undefined;
  const milliseconds = { second: 1000, minute: 60000, hour: 3600000 }[payload.unit];
  const sign = (payload.direction === "after" ? 1 : -1) * (inverse ? -1 : 1);
  const shifted = new Date(value.getTime() + sign * payload.value * milliseconds);
  return Number.isFinite(shifted.getTime()) ? fromUtc(shifted, precision(date)) : undefined;
}

function anchorDate(dataset: Dataset, event: Event): HistoryDate | undefined {
  const history2 = getHistory2PositionEditorValues(dataset, event);
  if (history2?.approximation) return undefined;
  const date = history2?.date ?? getEventHistoryTime(event);
  return date && date.year !== undefined && validateHistoryDate(date) === null ? date : undefined;
}

export function getQuantitativeTimeCandidates(dataset: Dataset, eventId: string): QuantitativeTimeCandidate[] {
  const event = dataset.events.find(({ id }) => id === eventId);
  if (!event) return [];
  return getQuantitativeRelations(dataset, eventId).flatMap(({ relation, payload }) => {
    const inverse = relation.sourceId === eventId;
    const anchorEventId = inverse ? relation.targetId : relation.sourceId;
    const anchor = dataset.events.find(({ id }) => id === anchorEventId);
    const date = anchor && anchorDate(dataset, anchor);
    if (!date) return [];
    const candidate = payload.type === "calendar-granule-relation"
      ? shiftGranule(date, payload.granularity, inverse ? -payload.displacement : payload.displacement)
      : shiftElapsed(date, payload, inverse);
    if (!candidate || !Number.isSafeInteger(candidate.year) || validateHistoryDate(candidate) !== null) return [];
    return [{ relationId: relation.id, anchorEventId, eventId, date: candidate, payload }];
  });
}
