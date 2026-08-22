import type { Event } from "../models/Event";
import { getEventHistoryTime } from "./HistoryService.ts";

export type EventHistoryDependencyValues = {
  year: number | undefined;
  month: number | undefined;
  day: number | undefined;
  hour: number | undefined;
  minute: number | undefined;
  second: number | undefined;
};

export function getEventHistoryDependencyValues(
  event: Event | null,
): EventHistoryDependencyValues {
  const time = event ? getEventHistoryTime(event) : undefined;
  return {
    year: time?.year,
    month: time?.month,
    day: time?.day,
    hour: time?.hour,
    minute: time?.minute,
    second: time?.second,
  };
}
