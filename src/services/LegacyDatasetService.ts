import { validateHistoryDate } from "./HistoryService.ts";

export const LEGACY_EVENT_DATE_PROFILE =
  "narrativeline.event-date-string.v1" as const;

export interface LegacyDatasetMigrationIssue {
  code:
    | "legacy_event_date_history_conflict"
    | "legacy_event_date_invalid";
  path: string;
}

export type LegacyDatasetMigrationResult =
  | { status: "not_legacy" }
  | {
      status: "invalid";
      profile: typeof LEGACY_EVENT_DATE_PROFILE;
      issue: LegacyDatasetMigrationIssue;
    }
  | {
      status: "migrated";
      profile: typeof LEGACY_EVENT_DATE_PROFILE;
      value: unknown;
    };

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: JsonObject, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasHistoryExtension(event: JsonObject): boolean {
  const extensions = event.extensions;
  return isObject(extensions) && hasOwn(extensions, "history");
}

function parseLegacyDate(value: string):
  | { year: number; month: number; day: number }
  | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }

  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  return validateHistoryDate(date) === null ? date : undefined;
}

/**
 * Converts the first documented NarrativeLine legacy profile in memory.
 *
 * Recognition is deliberately exact: every Event must own a top-level `date`
 * string and no Event may already contain History. Other shapes remain current
 * E2R input and are left untouched for the Validator to assess.
 */
export function migrateLegacyDataset(
  value: unknown,
): LegacyDatasetMigrationResult {
  if (!isObject(value) || !Array.isArray(value.events) || value.events.length === 0) {
    return { status: "not_legacy" };
  }

  const events = value.events;
  if (!events.every((event) => isObject(event) && hasOwn(event, "date"))) {
    return { status: "not_legacy" };
  }

  const historyConflictIndex = events.findIndex(
    (event) => isObject(event) && hasHistoryExtension(event),
  );
  if (historyConflictIndex >= 0) {
    return {
      status: "invalid",
      profile: LEGACY_EVENT_DATE_PROFILE,
      issue: {
        code: "legacy_event_date_history_conflict",
        path: `/events/${historyConflictIndex}`,
      },
    };
  }

  const parsedDates: Array<
    { year: number; month: number; day: number } | undefined
  > = [];

  for (const [index, event] of events.entries()) {
    const legacyDate = (event as JsonObject).date;
    if (legacyDate === "") {
      parsedDates.push(undefined);
      continue;
    }

    if (typeof legacyDate !== "string") {
      return {
        status: "invalid",
        profile: LEGACY_EVENT_DATE_PROFILE,
        issue: {
          code: "legacy_event_date_invalid",
          path: `/events/${index}/date`,
        },
      };
    }

    const parsedDate = parseLegacyDate(legacyDate);
    if (!parsedDate) {
      return {
        status: "invalid",
        profile: LEGACY_EVENT_DATE_PROFILE,
        issue: {
          code: "legacy_event_date_invalid",
          path: `/events/${index}/date`,
        },
      };
    }

    parsedDates.push(parsedDate);
  }

  const migrated = structuredClone(value) as JsonObject;
  const migratedEvents = migrated.events as JsonObject[];

  for (const [index, event] of migratedEvents.entries()) {
    delete event.date;
    const date = parsedDates[index];

    if (date) {
      event.extensions = {
        ...(isObject(event.extensions) ? event.extensions : {}),
        history: { time: date },
      };
    }
  }

  return {
    status: "migrated",
    profile: LEGACY_EVENT_DATE_PROFILE,
    value: migrated,
  };
}
