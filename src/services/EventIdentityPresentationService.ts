import type { Event } from "../models/Event";
import {
  formatEventHistoryDate,
  formatEventHistoryTime,
} from "./HistoryService.ts";

const MIN_HINT_LENGTH = 8;

export type EventIdentityChronology = {
  key: string;
  label: string;
};

export type EventIdentityPresentation = {
  eventId: string;
  primary: string;
  ambiguousPrimary: boolean;
  chronologyHint?: string;
  needsShortId: boolean;
  shortIdHint?: string;
};

type EventIdentityPresentationOptions = {
  getPrimary: (event: Event) => string;
  getChronology: (event: Event) => EventIdentityChronology | undefined;
};

export function getEventIdentityChronology(
  event: Event,
): EventIdentityChronology | undefined {
  const date = formatEventHistoryDate(event);
  const time = formatEventHistoryTime(event, true);
  const label = [date, time].filter((value) => value !== undefined).join(" ");

  return label === "" ? undefined : { key: label, label };
}

function prefixFor(id: string, length: number): string {
  return id.slice(0, Math.min(length, id.length));
}

function getUniqueHints(ids: readonly string[]): Map<string, string> {
  const result = new Map<string, string>();

  ids.forEach((id) => {
    let length = MIN_HINT_LENGTH;
    const maximumLength = id.length;

    while (
      length < maximumLength &&
      ids.some(
        (other) =>
          other !== id && prefixFor(other, length) === prefixFor(id, length),
      )
    ) {
      length += 1;
    }

    result.set(id, prefixFor(id, length));
  });

  return result;
}

export function resolveEventIdentityPresentations(
  events: readonly Event[],
  { getPrimary, getChronology }: EventIdentityPresentationOptions,
): Map<string, EventIdentityPresentation> {
  const primaryGroups = new Map<string, Event[]>();
  const chronologyById = new Map<
    string,
    EventIdentityChronology | undefined
  >();

  events.forEach((event) => {
    const group = primaryGroups.get(getPrimary(event)) ?? [];
    group.push(event);
    primaryGroups.set(getPrimary(event), group);
    chronologyById.set(event.id, getChronology(event));
  });

  const unresolvedIds: string[] = [];
  const results = new Map<string, EventIdentityPresentation>();

  events.forEach((event) => {
    const primary = getPrimary(event);
    const group = primaryGroups.get(primary) ?? [event];
    const chronology = chronologyById.get(event.id);
    const ambiguousPrimary = group.length > 1;
    const chronologyCollision =
      chronology === undefined ||
      group.some(
        (other) =>
          other.id !== event.id &&
          chronologyById.get(other.id)?.key === chronology.key,
      );
    const needsShortId = ambiguousPrimary && chronologyCollision;

    if (needsShortId) unresolvedIds.push(event.id);

    results.set(event.id, {
      eventId: event.id,
      primary,
      ambiguousPrimary,
      ...(chronology ? { chronologyHint: chronology.label } : {}),
      needsShortId,
    });
  });

  const shortIdHints = getUniqueHints(unresolvedIds);
  results.forEach((presentation, eventId) => {
    if (!presentation.needsShortId) return;

    presentation.shortIdHint = shortIdHints.get(eventId);
  });

  return results;
}
