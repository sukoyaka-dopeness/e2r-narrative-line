import type { Dataset } from "../models/Dataset";
import type { Event } from "../models/Event";
import {
  compareEventsByHistoryDate,
  getEventHistoryTime,
  validateHistoryDate,
  type HistoryDate,
} from "./HistoryService.ts";
import { getHistory2PositionEditorValues } from "./History2Service.ts";
import { projectRelativeTimeForTimeline } from "./RelativeTimeService.ts";
import {
  getCompleteSupportedExtensionUses,
  SPECIFICATION_EXTENSION_ID,
  SPECIFICATION_EXTENSION_VERSION,
} from "./SpecificationDeclarationService.ts";
import { validateCoreDataset } from "./ValidationService.ts";

export const PERSPECTIVE_EXTENSION_ID = "draft.github.sukoyaka-dopeness.perspective";
export const PERSPECTIVE_VERSION = "0.1.0";

type JsonRecord = Record<string, unknown>;
type PerspectiveEntry = { name: string; eventOrder: string[] };
type PerspectivePayload = { perspectives: Record<string, PerspectiveEntry> };

export type PerspectiveAvailability =
  | { kind: "absent" }
  | { kind: "unsupported" }
  | { kind: "multiple"; count: number }
  | { kind: "single"; id: string; entry: PerspectiveEntry; payload: PerspectivePayload };

export type PerspectiveDiagnostic = {
  kind: "dangling" | "history" | "relative-band";
  eventIds: string[];
};

export type PerspectiveTimeline = {
  events: Event[];
  availability: PerspectiveAvailability;
  placedIds: Set<string>;
  diagnostics: PerspectiveDiagnostic[];
  canAuthor: boolean;
};

export type PerspectiveMoveResult =
  | { ok: true; dataset: Dataset }
  | { ok: false; reason: "unavailable" | "boundary" | "invalid_dataset" };

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extensionIds(dataset: Dataset): Set<string> {
  const ids = new Set<string>();
  for (const object of [dataset, ...dataset.entities, ...dataset.events, ...dataset.relations]) {
    for (const [id, payload] of Object.entries(object.extensions ?? {})) {
      if (id !== SPECIFICATION_EXTENSION_ID && payload !== undefined) ids.add(id);
    }
  }
  return ids;
}

function specificationUses(dataset: Dataset): JsonRecord[] | undefined {
  const specification = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  if (!isRecord(specification) ||
      specification.specVersion !== SPECIFICATION_EXTENSION_VERSION ||
      !Array.isArray(specification.uses) ||
      !specification.uses.every((item) =>
        isRecord(item) && typeof item.extension === "string" && typeof item.version === "string")) {
    return undefined;
  }
  const uses = specification.uses as JsonRecord[];
  const ids = extensionIds(dataset);
  if (new Set(uses.map((item) => item.extension)).size !== uses.length ||
      uses.some((item) => !ids.has(item.extension as string)) ||
      [...ids].some((id) => !uses.some((item) => item.extension === id))) {
    return undefined;
  }
  return uses;
}

function parsePayload(value: unknown): PerspectivePayload | undefined {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "perspectives") ||
      !isRecord(value.perspectives) || Object.keys(value.perspectives).length === 0) {
    return undefined;
  }
  const entries = Object.entries(value.perspectives);
  if (entries.some(([id, entry]) =>
    id.length === 0 || !isRecord(entry) ||
    Object.keys(entry).some((key) => key !== "name" && key !== "eventOrder") ||
    typeof entry.name !== "string" || entry.name.length === 0 ||
    !Array.isArray(entry.eventOrder) ||
    !entry.eventOrder.every((eventId) => typeof eventId === "string" && eventId.length > 0) ||
    new Set(entry.eventOrder).size !== entry.eventOrder.length)) {
    return undefined;
  }
  return value as PerspectivePayload;
}

export function readPerspectiveAvailability(dataset: Dataset): PerspectiveAvailability {
  const value = dataset.extensions?.[PERSPECTIVE_EXTENSION_ID];
  const misplaced = [...dataset.entities, ...dataset.events, ...dataset.relations]
    .some((object) => object.extensions?.[PERSPECTIVE_EXTENSION_ID] !== undefined);
  if (value === undefined && !misplaced) {
    const uses = specificationUses(dataset);
    if (dataset.extensions?.[SPECIFICATION_EXTENSION_ID] !== undefined && !uses) {
      return { kind: "unsupported" };
    }
    if (uses?.some((item) => item.extension === PERSPECTIVE_EXTENSION_ID)) {
      return { kind: "unsupported" };
    }
    return { kind: "absent" };
  }
  if (value === undefined || misplaced) return { kind: "unsupported" };
  const uses = specificationUses(dataset);
  const matching = uses?.filter((item) => item.extension === PERSPECTIVE_EXTENSION_ID);
  if (matching?.length !== 1 || matching[0].version !== PERSPECTIVE_VERSION ||
      matching[0].features !== undefined) return { kind: "unsupported" };
  const payload = parsePayload(value);
  if (!payload) return { kind: "unsupported" };
  const entries = Object.entries(payload.perspectives);
  if (entries.length !== 1) return { kind: "multiple", count: entries.length };
  return { kind: "single", id: entries[0][0], entry: entries[0][1], payload };
}

function derivedTimelineEvents(dataset: Dataset): Event[] {
  const events = [...dataset.events].sort((left, right) =>
    compareEventsByHistoryDate(left, right, dataset));
  const byId = new Map(events.map((event) => [event.id, event]));
  const groups = projectRelativeTimeForTimeline(dataset).groups;
  for (const group of groups) {
    const ordered = group.eventIdsByDisplayBand.flat().map((id) => byId.get(id))
      .filter((event): event is Event => event !== undefined);
    const slots = events.flatMap((event, index) =>
      ordered.some((member) => member.id === event.id) ? [index] : []);
    slots.forEach((slot, index) => { events[slot] = ordered[index]; });
  }
  return events;
}

function applyPlacedSequence(base: Event[], sequence: string[]): Event[] {
  const byId = new Map(base.map((event) => [event.id, event]));
  const placed = sequence.map((id) => byId.get(id))
    .filter((event): event is Event => event !== undefined);
  if (placed.length === 0) return base;
  const placedIds = new Set(placed.map((event) => event.id));
  const slots = base.flatMap((event, index) => placedIds.has(event.id) ? [index] : []);
  const result = [...base];
  slots.forEach((slot, index) => { result[slot] = placed[index]; });
  return result;
}

function recordedDateComparison(left: HistoryDate | undefined, right: HistoryDate | undefined): number {
  if (!left || !right || validateHistoryDate(left) !== null ||
      validateHistoryDate(right) !== null) return 0;
  for (const key of ["year", "month", "day", "hour", "minute", "second"] as const) {
    const a = left[key];
    const b = right[key];
    if (a === undefined || b === undefined) return 0;
    if (a !== b) return a < b ? -1 : 1;
  }
  return 0;
}

function historyValues(dataset: Dataset, event: Event): {
  date: HistoryDate | undefined;
  temporalOrder: number | undefined;
} {
  const history2 = getHistory2PositionEditorValues(dataset, event);
  return {
    date: getEventHistoryTime(event) ?? history2?.date,
    temporalOrder: history2?.temporalOrder ?? event.extensions?.history?.time?.temporalOrder,
  };
}

function diagnosticsFor(dataset: Dataset, sequence: string[]): PerspectiveDiagnostic[] {
  const byId = new Map(dataset.events.map((event) => [event.id, event]));
  const diagnostics: PerspectiveDiagnostic[] = sequence
    .filter((id) => !byId.has(id))
    .map((id) => ({ kind: "dangling", eventIds: [id] }));
  const placed = sequence.map((id) => byId.get(id))
    .filter((event): event is Event => event !== undefined);
  const bands = new Map<string, { group: number; band: number }>();
  projectRelativeTimeForTimeline(dataset).groups.forEach((group, groupIndex) => {
    group.eventIdsByDisplayBand.forEach((ids, bandIndex) => {
      ids.forEach((id) => bands.set(id, { group: groupIndex, band: bandIndex }));
    });
  });
  for (let left = 0; left < placed.length; left += 1) {
    for (let right = left + 1; right < placed.length; right += 1) {
      const a = placed[left];
      const b = placed[right];
      const aHistory = historyValues(dataset, a);
      const bHistory = historyValues(dataset, b);
      const dateComparison = recordedDateComparison(aHistory.date, bHistory.date);
      if (dateComparison > 0 ||
          (dateComparison === 0 && Number.isInteger(aHistory.temporalOrder) &&
            Number.isInteger(bHistory.temporalOrder) &&
            aHistory.temporalOrder! > bHistory.temporalOrder!)) {
        diagnostics.push({ kind: "history", eventIds: [a.id, b.id] });
      }
      const aBand = bands.get(a.id);
      const bBand = bands.get(b.id);
      if (aBand && bBand && aBand.group === bBand.group && aBand.band > bBand.band) {
        diagnostics.push({ kind: "relative-band", eventIds: [a.id, b.id] });
      }
    }
  }
  return diagnostics;
}

function canCreatePerspective(dataset: Dataset): boolean {
  if (dataset.extensions?.[SPECIFICATION_EXTENSION_ID] !== undefined) {
    return specificationUses(dataset) !== undefined;
  }
  return extensionIds(dataset).size === 0 ||
    getCompleteSupportedExtensionUses(dataset) !== undefined;
}

export function getPerspectiveTimeline(dataset: Dataset): PerspectiveTimeline {
  const availability = readPerspectiveAvailability(dataset);
  const base = derivedTimelineEvents(dataset);
  const sequence = availability.kind === "single" ? availability.entry.eventOrder : [];
  return {
    events: applyPlacedSequence(base, sequence),
    availability,
    placedIds: new Set(sequence),
    diagnostics: availability.kind === "single" ? diagnosticsFor(dataset, sequence) : [],
    canAuthor: availability.kind === "single" ||
      (availability.kind === "absent" && canCreatePerspective(dataset)),
  };
}

function withPerspectiveDeclaration(dataset: Dataset): Dataset | undefined {
  const specification = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  const existingUses = specification === undefined
    ? (extensionIds(dataset).size === 0 ? [] : getCompleteSupportedExtensionUses(dataset))
    : specificationUses(dataset);
  if (!existingUses) return undefined;
  return {
    ...dataset,
    extensions: {
      ...(dataset.extensions ?? {}),
      [SPECIFICATION_EXTENSION_ID]: {
        ...(isRecord(specification) ? specification : {}),
        specVersion: SPECIFICATION_EXTENSION_VERSION,
        uses: [...existingUses, { extension: PERSPECTIVE_EXTENSION_ID, version: PERSPECTIVE_VERSION }],
      },
    },
  };
}

function preserveDanglingSlots(previous: string[], present: string[], presentIds: Set<string>): string[] {
  const result = [...present];
  let seenPresent = 0;
  let inserted = 0;
  for (const id of previous) {
    if (presentIds.has(id)) {
      seenPresent += 1;
    } else {
      result.splice(Math.min(seenPresent + inserted, result.length), 0, id);
      inserted += 1;
    }
  }
  return result;
}

export function movePerspectiveEvent(
  dataset: Dataset,
  eventId: string,
  direction: "earlier" | "later",
): PerspectiveMoveResult {
  const timeline = getPerspectiveTimeline(dataset);
  if (!timeline.canAuthor) return { ok: false, reason: "unavailable" };
  const events = timeline.events;
  const index = events.findIndex((event) => event.id === eventId);
  const targetIndex = index + (direction === "earlier" ? -1 : 1);
  if (index < 0 || targetIndex < 0 || targetIndex >= events.length) {
    return { ok: false, reason: "boundary" };
  }
  const currentSequence = timeline.availability.kind === "single"
    ? timeline.availability.entry.eventOrder : [];
  const moved = [...events];
  [moved[index], moved[targetIndex]] = [moved[targetIndex], moved[index]];
  const placedIds = new Set([...currentSequence, events[index].id, events[targetIndex].id]);
  const presentIds = new Set(dataset.events.map((event) => event.id));
  const present = moved.map((event) => event.id).filter((id) => placedIds.has(id));
  const nextSequence = preserveDanglingSlots(currentSequence, present, presentIds);
  const source = timeline.availability.kind === "single"
    ? dataset : withPerspectiveDeclaration(dataset);
  if (!source) return { ok: false, reason: "unavailable" };
  const previousPayload = timeline.availability.kind === "single"
    ? timeline.availability.payload : undefined;
  const perspectiveId = timeline.availability.kind === "single"
    ? timeline.availability.id : "timeline-order";
  const previousEntry = timeline.availability.kind === "single"
    ? timeline.availability.entry : undefined;
  const result: Dataset = {
    ...source,
    extensions: {
      ...(source.extensions ?? {}),
      [PERSPECTIVE_EXTENSION_ID]: {
        perspectives: {
          ...(previousPayload?.perspectives ?? {}),
          [perspectiveId]: {
            ...(previousEntry ?? { name: "Timeline order" }),
            eventOrder: nextSequence,
          },
        },
      },
    },
  };
  return validateCoreDataset(result).isValid
    ? { ok: true, dataset: result }
    : { ok: false, reason: "invalid_dataset" };
}

export function removeDeletedEventFromPerspective(dataset: Dataset, eventId: string): Dataset | undefined {
  if (dataset.extensions?.[PERSPECTIVE_EXTENSION_ID] === undefined) {
    return [...dataset.entities, ...dataset.events, ...dataset.relations]
      .some((object) => object.extensions?.[PERSPECTIVE_EXTENSION_ID] !== undefined)
      ? undefined : dataset;
  }
  const availability = readPerspectiveAvailability(dataset);
  if (availability.kind === "unsupported") return undefined;
  const payload = parsePayload(dataset.extensions[PERSPECTIVE_EXTENSION_ID]);
  if (!payload) return undefined;
  return {
    ...dataset,
    extensions: {
      ...dataset.extensions,
      [PERSPECTIVE_EXTENSION_ID]: {
        perspectives: Object.fromEntries(Object.entries(payload.perspectives).map(([id, entry]) => [
          id,
          { ...entry, eventOrder: entry.eventOrder.filter((item) => item !== eventId) },
        ])),
      },
    },
  };
}
