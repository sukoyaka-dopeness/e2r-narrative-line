import type { Dataset } from "../models/Dataset";
import type { Event } from "../models/Event";
import {
  HISTORY_2_CANDIDATE_VERSION,
  SPECIFICATION_EXTENSION_ID,
  classifyHistoryCapability,
  type HistoryCapabilityResult,
} from "./HistoryCapabilityService.ts";
import type { HistoryDate } from "./HistoryService.ts";
import {
  getCompleteSupportedExtensionUses,
  SPECIFICATION_EXTENSION_VERSION,
} from "./SpecificationDeclarationService.ts";

export const HISTORY_2_APPROXIMATION = "circa" as const;

export type History2PositionUpdate = {
  position: HistoryDate;
  approximation: boolean;
};

export type History2PositionEditorValues = {
  date: HistoryDate;
  approximation: boolean;
  assertionId: string;
  temporalOrder?: number;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function onlyKnownKeys(value: JsonRecord, knownKeys: readonly string[]): boolean {
  return Object.keys(value).every((key) => knownKeys.includes(key));
}

function readPositionDate(position: JsonRecord): HistoryDate {
  return {
    ...(typeof position.year === "number" ? { year: position.year } : {}),
    ...(typeof position.month === "number" ? { month: position.month } : {}),
    ...(typeof position.day === "number" ? { day: position.day } : {}),
    ...(typeof position.hour === "number" ? { hour: position.hour } : {}),
    ...(typeof position.minute === "number" ? { minute: position.minute } : {}),
    ...(typeof position.second === "number" ? { second: position.second } : {}),
  };
}

function readHistory2PositionAssertion(
  dataset: Dataset,
  event: Event,
): JsonRecord | undefined {
  const capability: HistoryCapabilityResult = classifyHistoryCapability(dataset, event);
  if (capability.capability !== "candidate") return undefined;

  const history = event.extensions?.history;
  if (!isRecord(history) || !Array.isArray(history.assertions) || history.assertions.length !== 1) {
    return undefined;
  }

  const assertion = history.assertions[0];
  if (
    !isRecord(assertion) ||
    assertion.type !== "position" ||
    typeof assertion.id !== "string" ||
    !isRecord(assertion.position) ||
    !onlyKnownKeys(assertion, ["id", "type", "position", "temporalOrder"]) ||
    !onlyKnownKeys(assertion.position, [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
      "timeZone",
      "offset",
      "approximation",
    ]) ||
    typeof assertion.position.year !== "number" ||
    (assertion.position.approximation !== undefined &&
      assertion.position.approximation !== HISTORY_2_APPROXIMATION)
  ) {
    return undefined;
  }

  return assertion;
}

export function getHistory2PositionEditorValues(
  dataset: Dataset,
  event: Event | null | undefined,
): History2PositionEditorValues | undefined {
  if (!event) return undefined;
  const assertion = readHistory2PositionAssertion(dataset, event);
  if (!assertion || !isRecord(assertion.position)) return undefined;

  return {
    date: readPositionDate(assertion.position),
    approximation: assertion.position.approximation === HISTORY_2_APPROXIMATION,
    assertionId: assertion.id as string,
    ...(typeof assertion.temporalOrder === "number"
      ? { temporalOrder: assertion.temporalOrder }
      : {}),
  };
}

function readKnownHistoryTime(event: Event): JsonRecord | undefined {
  const history = event.extensions?.history;
  if (!isRecord(history) || !isRecord(history.time)) return undefined;
  if (
    !onlyKnownKeys(history, ["time"]) ||
    !onlyKnownKeys(history.time, [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
      "timeZone",
      "offset",
      "temporalOrder",
    ])
  ) {
    return undefined;
  }
  return history.time;
}

function positionFromStableTime(time: JsonRecord): JsonRecord {
  const position: JsonRecord = { ...time };
  delete position.temporalOrder;
  return position;
}

function applyPositionUpdate(
  currentPosition: JsonRecord,
  update: History2PositionUpdate,
): JsonRecord {
  const nextPosition: JsonRecord = {
    ...currentPosition,
    ...(update.position.year === undefined ? {} : { year: update.position.year }),
    ...(update.position.month === undefined ? {} : { month: update.position.month }),
    ...(update.position.day === undefined ? {} : { day: update.position.day }),
    ...(update.position.hour === undefined ? {} : { hour: update.position.hour }),
    ...(update.position.minute === undefined ? {} : { minute: update.position.minute }),
    ...(update.position.second === undefined ? {} : { second: update.position.second }),
  };

  if (update.position.year === undefined) {
    delete nextPosition.year;
    delete nextPosition.month;
    delete nextPosition.day;
    delete nextPosition.hour;
    delete nextPosition.minute;
    delete nextPosition.second;
    delete nextPosition.timeZone;
    delete nextPosition.offset;
  } else if (update.position.month === undefined) {
    delete nextPosition.month;
    delete nextPosition.day;
    delete nextPosition.hour;
    delete nextPosition.minute;
    delete nextPosition.second;
    delete nextPosition.timeZone;
    delete nextPosition.offset;
  } else if (update.position.day === undefined) {
    delete nextPosition.day;
    delete nextPosition.hour;
    delete nextPosition.minute;
    delete nextPosition.second;
    delete nextPosition.timeZone;
    delete nextPosition.offset;
  } else if (update.position.hour === undefined) {
    delete nextPosition.hour;
    delete nextPosition.minute;
    delete nextPosition.second;
    delete nextPosition.timeZone;
    delete nextPosition.offset;
  } else if (update.position.minute === undefined) {
    delete nextPosition.minute;
    delete nextPosition.second;
    delete nextPosition.timeZone;
    delete nextPosition.offset;
  } else if (update.position.second === undefined) {
    delete nextPosition.second;
  }

  if (update.approximation) {
    nextPosition.approximation = HISTORY_2_APPROXIMATION;
  } else {
    delete nextPosition.approximation;
  }

  return nextPosition;
}

function updateHistoryDeclaration(
  dataset: Dataset,
  version: string,
  features: string[],
): Dataset {
  const existing = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  if (existing === undefined) {
    const provisionalDataset: Dataset = {
      ...dataset,
      extensions: {
        ...(dataset.extensions ?? {}),
        [SPECIFICATION_EXTENSION_ID]: {
          specVersion: SPECIFICATION_EXTENSION_VERSION,
          uses: [
            {
              extension: "history",
              version,
              ...(features.length > 0 ? { features } : {}),
            },
          ],
        },
      },
    };
    const uses = getCompleteSupportedExtensionUses(provisionalDataset);
    if (!uses) {
      throw new Error("History 2 declaration could not be created safely");
    }
    return {
      ...dataset,
      extensions: {
        ...(dataset.extensions ?? {}),
        [SPECIFICATION_EXTENSION_ID]: {
          specVersion: SPECIFICATION_EXTENSION_VERSION,
          uses,
        },
      },
    };
  }

  if (!isRecord(existing) || !Array.isArray(existing.uses)) {
    throw new Error("History 2 declaration could not be updated safely");
  }

  const historyUses = existing.uses.filter(
    (use) => isRecord(use) && use.extension === "history",
  );
  if (historyUses.length !== 1) {
    throw new Error("History 2 declaration must contain exactly one History use");
  }

  const nextUses = existing.uses.map((use) => {
    if (!isRecord(use) || use.extension !== "history") return use;
    return {
      extension: "history",
      version,
      ...(features.length > 0 ? { features } : {}),
    };
  });

  return {
    ...dataset,
    extensions: {
      ...(dataset.extensions ?? {}),
      [SPECIFICATION_EXTENSION_ID]: {
        ...existing,
        uses: nextUses,
      },
    },
  };
}

function removeHistoryDeclaration(dataset: Dataset): Dataset {
  const existing = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  if (!isRecord(existing) || !Array.isArray(existing.uses)) return dataset;

  const nextUses = existing.uses.filter(
    (use) => !(isRecord(use) && use.extension === "history"),
  );
  const nextSpecification = { ...existing, uses: nextUses };
  const hasOtherKnownContent = ["definitions", "lifecycle", "evolution"].some(
    (key) => hasOwn(nextSpecification, key),
  );
  const hasUnknownContent = Object.keys(nextSpecification).some(
    (key) => !["specVersion", "uses", "definitions", "lifecycle", "evolution"].includes(key),
  );

  if (nextUses.length === 0 && !hasOtherKnownContent && !hasUnknownContent) {
    const nextExtensions = { ...(dataset.extensions ?? {}) };
    delete nextExtensions[SPECIFICATION_EXTENSION_ID];
    return Object.keys(nextExtensions).length === 0
      ? (() => {
          const nextDataset = { ...dataset };
          delete nextDataset.extensions;
          return nextDataset;
        })()
      : { ...dataset, extensions: nextExtensions };
  }

  return {
    ...dataset,
    extensions: {
      ...(dataset.extensions ?? {}),
      [SPECIFICATION_EXTENSION_ID]: nextSpecification,
    },
  };
}

function history2Features(approximation: boolean): string[] {
  return approximation ? ["approximation"] : [];
}

export function updateEventHistory2Position(
  dataset: Dataset,
  eventId: string,
  update: History2PositionUpdate,
): Dataset {
  const event = dataset.events.find((candidate) => candidate.id === eventId);
  if (!event) throw new Error("Event not found");

  const existingH2 = readHistory2PositionAssertion(dataset, event);
  const currentTime = existingH2
    ? undefined
    : readKnownHistoryTime(event);
  const capability = classifyHistoryCapability(dataset, event);

  if (
    capability.capability === "stable" &&
    isRecord(event.extensions?.history) &&
    hasOwn(event.extensions.history, "time") &&
    currentTime === undefined
  ) {
    throw new Error("History 2 edit refused: unknown stable History fields");
  }

  if (!existingH2 && capability.capability !== "stable" && capability.capability !== "none") {
    throw new Error(`History 2 edit refused: ${capability.capability}`);
  }

  const currentPosition = existingH2 && isRecord(existingH2.position)
    ? existingH2.position
    : currentTime
      ? positionFromStableTime(currentTime)
      : {};
  const nextPosition = applyPositionUpdate(currentPosition, update);

  let nextDataset: Dataset;
  if (!hasOwn(nextPosition, "year")) {
    nextDataset = {
      ...dataset,
      events: dataset.events.map((candidate) => {
        if (candidate.id !== eventId) return candidate;
        const nextExtensions = { ...(candidate.extensions ?? {}) };
        delete nextExtensions.history;
        if (Object.keys(nextExtensions).length === 0) {
          const nextEvent = { ...candidate };
          delete nextEvent.extensions;
          return nextEvent;
        }
        return { ...candidate, extensions: nextExtensions };
      }),
    };
    return removeHistoryDeclaration(nextDataset);
  }

  const assertionId = existingH2?.id as string | undefined;
  const temporalOrder = existingH2?.temporalOrder;
  const assertion = {
    id: assertionId ?? `history-position-${eventId}`,
    type: "position" as const,
    position: nextPosition,
    ...(typeof temporalOrder === "number" ? { temporalOrder } : {}),
  };
  nextDataset = {
    ...dataset,
    events: dataset.events.map((candidate) =>
      candidate.id === eventId
        ? {
            ...candidate,
            extensions: {
              ...(candidate.extensions ?? {}),
              history: { assertions: [assertion] },
            },
          }
        : candidate,
    ),
  };

  return updateHistoryDeclaration(
    nextDataset,
    HISTORY_2_CANDIDATE_VERSION,
    history2Features(update.approximation),
  );
}
