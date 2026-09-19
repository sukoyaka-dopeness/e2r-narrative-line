import type { Dataset } from "../models/Dataset";
import type { CoreObject } from "../models/CoreObject";
import type { Event } from "../models/Event";
import { validateCoreDataset } from "./ValidationService.ts";
import type { HistoryDate } from "./HistoryService.ts";
import {
  HISTORY_2_CANDIDATE_VERSION,
  SPECIFICATION_EXTENSION_ID,
  STABLE_HISTORY_VERSION,
  classifyHistoryCapability,
  readHistoryDeclaration,
  type HistoryCapabilityResult,
} from "./HistoryCapabilityService.ts";
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

const HISTORY_TIME_KEYS = [
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "timeZone",
  "offset",
  "temporalOrder",
] as const;

function allCoreObjects(dataset: Dataset): CoreObject[] {
  return [...dataset.entities, ...dataset.events, ...dataset.relations];
}

function readHistoryTime(object: CoreObject): JsonRecord | undefined {
  const history = object.extensions?.history;
  if (!isRecord(history) || !onlyKnownKeys(history, ["time"])) return undefined;
  if (!isRecord(history.time) || !onlyKnownKeys(history.time, HISTORY_TIME_KEYS)) {
    return undefined;
  }
  return history.time;
}

function historyDateFromTime(time: JsonRecord): HistoryDate {
  return {
    ...(typeof time.year === "number" ? { year: time.year } : {}),
    ...(typeof time.month === "number" ? { month: time.month } : {}),
    ...(typeof time.day === "number" ? { day: time.day } : {}),
    ...(typeof time.hour === "number" ? { hour: time.hour } : {}),
    ...(typeof time.minute === "number" ? { minute: time.minute } : {}),
    ...(typeof time.second === "number" ? { second: time.second } : {}),
  };
}

function isValidHistoryDate(date: HistoryDate): boolean {
  const { year, month, day, hour, minute, second } = date;
  if (year === undefined || !Number.isInteger(year)) return false;
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) return false;
  if (day !== undefined && (!Number.isInteger(day) || month === undefined)) return false;
  if (hour !== undefined && (!Number.isInteger(hour) || day === undefined)) return false;
  if (minute !== undefined && (!Number.isInteger(minute) || hour === undefined)) return false;
  if (second !== undefined && (!Number.isInteger(second) || minute === undefined)) return false;
  if (day !== undefined) {
    const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
    const lastDay = month === 2
      ? (leap ? 29 : 28)
      : [4, 6, 9, 11].includes(month!) ? 30 : 31;
    if (day < 1 || day > lastDay) return false;
  }
  if (hour !== undefined && (hour < 0 || hour > 23)) return false;
  if (minute !== undefined && (minute < 0 || minute > 59)) return false;
  if (second !== undefined && (second < 0 || second > 59)) return false;
  return true;
}

function isEligibleHistory1Time(time: JsonRecord): boolean {
  if (!Number.isInteger(time.year)) return false;
  if (time.temporalOrder !== undefined && !Number.isInteger(time.temporalOrder)) return false;
  if (!isValidHistoryDate(historyDateFromTime(time))) return false;
  if (time.timeZone !== undefined || time.offset !== undefined) {
    if (
      typeof time.timeZone !== "string" ||
      time.timeZone.trim() === "" ||
      typeof time.offset !== "string" ||
      !/^[+-][0-9]{2}:[0-9]{2}$/.test(time.offset) ||
      time.minute === undefined
    ) {
      return false;
    }
  }
  return true;
}

function historyObjectsWithPayload(dataset: Dataset): CoreObject[] {
  return allCoreObjects(dataset).filter(
    (object) => object.extensions?.history !== undefined,
  );
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
  return readHistoryTime(event);
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
  if (historyUses.length > 1) {
    throw new Error("History 2 declaration must contain exactly one History use");
  }

  const historyUse = {
    extension: "history",
    version,
    ...(features.length > 0 ? { features } : {}),
  };
  const nextUses = historyUses.length === 0
    ? [...existing.uses, historyUse]
    : existing.uses.map((use) => {
        if (!isRecord(use) || use.extension !== "history") return use;
        return historyUse;
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
  if (historyObjectsWithPayload(dataset).length > 0) {
    return updateHistoryDeclaration(
      dataset,
      HISTORY_2_CANDIDATE_VERSION,
      history2FeaturesForDataset(dataset),
    );
  }

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

function expectedHistory2Features(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.assertions)) return [];
  const features = new Set<string>();
  if (payload.assertions.length > 1) features.add("multiple-assertions");
  for (const assertion of payload.assertions) {
    if (!isRecord(assertion)) continue;
    const positions = [
      assertion.position,
      assertion.earliest,
      assertion.latest,
      isRecord(assertion.start) ? assertion.start.position : undefined,
      isRecord(assertion.end) ? assertion.end.position : undefined,
    ];
    if (positions.some((position) => isRecord(position) && position.approximation !== undefined)) {
      features.add("approximation");
    }
    if (assertion.type === "bounded-point") features.add("bounded-point");
    if (assertion.type === "temporal-extent") features.add("temporal-extent");
  }
  return [...features].sort();
}

function history2FeaturesForDataset(dataset: Dataset): string[] {
  const features = new Set<string>();
  for (const object of historyObjectsWithPayload(dataset)) {
    for (const feature of expectedHistory2Features(object.extensions?.history)) {
      features.add(feature);
    }
  }
  return [...features].sort();
}

function refuseUpgrade(reason: string): never {
  throw new Error(`History 1 to History 2 upgrade refused: ${reason}`);
}

function convertHistory1Object(
  object: CoreObject,
  assertionId: string,
  approximation = false,
): CoreObject {
  const time = readHistoryTime(object);
  if (!time || !isEligibleHistory1Time(time)) {
    refuseUpgrade(`unsafe History on ${object.id}`);
  }
  const { temporalOrder, ...position } = time;
  const assertion = {
    id: assertionId,
    type: "position" as const,
    position: {
      ...position,
      ...(approximation ? { approximation: HISTORY_2_APPROXIMATION } : {}),
    },
    ...(typeof temporalOrder === "number" ? { temporalOrder } : {}),
  };
  const nextExtensions = {
    ...(object.extensions ?? {}),
    history: { assertions: [assertion] },
  };
  return { ...object, extensions: nextExtensions };
}

function assertEligibleH1Dataset(dataset: Dataset): void {
  if (dataset.extensions?.history !== undefined) {
    refuseUpgrade("Dataset-level History is not supported");
  }
  const declaration = readHistoryDeclaration(dataset);
  if (declaration.status === "invalid") {
    refuseUpgrade("invalid History declaration");
  }
  if (
    declaration.status === "declared" &&
    declaration.version !== STABLE_HISTORY_VERSION
  ) {
    refuseUpgrade(`existing History ${declaration.version} is not H1`);
  }
  if (declaration.status === "declared" && declaration.features.length > 0) {
    refuseUpgrade("unsupported H1 History Features");
  }

  for (const object of historyObjectsWithPayload(dataset)) {
    const payload = object.extensions?.history;
    const time = readHistoryTime(object);
    if (!time || !isEligibleHistory1Time(time)) {
      refuseUpgrade(`unsafe History on ${object.id}`);
    }
    if (isRecord(payload) && hasOwn(payload, "assertions")) {
      refuseUpgrade(`mixed or candidate History on ${object.id}`);
    }
  }
  if (declaration.status === "declared" && historyObjectsWithPayload(dataset).length === 0) {
    refuseUpgrade("History declaration has no payload");
  }
}

export function upgradeDatasetHistory1To2(
  dataset: Dataset,
  targetObjectId: string,
  update: History2PositionUpdate,
): Dataset {
  if (!update.approximation) {
    refuseUpgrade("the first H2-only operation must use circa");
  }
  if (validateCoreDataset(dataset).isValid === false) {
    refuseUpgrade("source Dataset is invalid");
  }
  assertEligibleH1Dataset(dataset);

  const objects = allCoreObjects(dataset);
  const target = objects.find((object) => object.id === targetObjectId);
  if (!target) throw new Error("Core Object not found");
  const targetTime = target.extensions?.history !== undefined
    ? readHistoryTime(target)
    : undefined;
  const targetTemporalOrder = targetTime?.temporalOrder;
  const targetPosition = targetTime ? positionFromStableTime(targetTime) : {};
  const targetNextPosition = applyPositionUpdate(targetPosition, update);
  if (!hasOwn(targetNextPosition, "year")) {
    refuseUpgrade("target approximation requires a year");
  }

  const nextObject = (object: CoreObject): CoreObject => {
    const current = object.extensions?.history;
    if (current === undefined) return object;
    const assertionId = `history-position-${object.id}`;
    if (object.id === targetObjectId) {
      const { ...position } = targetNextPosition;
      const assertion = {
        id: assertionId,
        type: "position" as const,
        position,
        ...(typeof targetTemporalOrder === "number" ? { temporalOrder: targetTemporalOrder } : {}),
      };
      return {
        ...object,
        extensions: { ...(object.extensions ?? {}), history: { assertions: [assertion] } },
      };
    }
    return convertHistory1Object(object, assertionId);
  };

  const nextDataset: Dataset = {
    ...dataset,
    entities: dataset.entities.map(nextObject) as Dataset["entities"],
    events: dataset.events.map(nextObject) as Dataset["events"],
    relations: dataset.relations.map(nextObject) as Dataset["relations"],
  };
  const withDeclaration = updateHistoryDeclaration(
    nextDataset,
    HISTORY_2_CANDIDATE_VERSION,
    history2FeaturesForDataset(nextDataset),
  );
  const validation = validateCoreDataset(withDeclaration);
  if (!validation.isValid) {
    refuseUpgrade("final Dataset validation failed");
  }
  return withDeclaration;
}

export function updateEventHistory2Position(
  dataset: Dataset,
  eventId: string,
  update: History2PositionUpdate,
): Dataset {
  const event = dataset.events.find((candidate) => candidate.id === eventId);
  if (!event) throw new Error("Event not found");

  const existingH2 = readHistory2PositionAssertion(dataset, event);
  if (!existingH2 && update.approximation) {
    return upgradeDatasetHistory1To2(dataset, eventId, update);
  }
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
