import type { Dataset } from "../models/Dataset";
import type { Relation } from "../models/Relation";
import { validateCoreDataset } from "./ValidationService.ts";
import {
  CALENDAR_GRANULE_FEATURE,
  ELAPSED_OFFSET_FEATURE,
  RELATIVE_TIME_EXTENSION_ID,
  RELATIVE_TIME_VERSION,
  ensureRelativeTimeDeclaration,
  hasExactRelativeTimeDeclaration,
} from "./RelativeTimeService.ts";
import { SPECIFICATION_EXTENSION_ID } from "./SpecificationDeclarationService.ts";

export type Granularity = "year" | "month" | "day" | "hour" | "minute" | "second";
export type ElapsedUnit = "second" | "minute" | "hour";
export type QuantitativePayload =
  | { type: typeof CALENDAR_GRANULE_FEATURE; granularity: Granularity; displacement: number; calendar?: string }
  | { type: typeof ELAPSED_OFFSET_FEATURE; direction: "before" | "after"; value: number; unit: ElapsedUnit };

export type QuantitativeOperation =
  | { type: "create"; sourceId: string; targetId: string; payload: QuantitativePayload; relationId: string }
  | { type: "update"; relationId: string; payload: QuantitativePayload }
  | { type: "delete"; relationId: string };

export type QuantitativeResult =
  | { ok: true; dataset: Dataset }
  | { ok: false; reason: "unsupported" | "invalid" };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readQuantitativePayload(relation: Relation): QuantitativePayload | undefined {
  const value = relation.extensions?.[RELATIVE_TIME_EXTENSION_ID];
  if (!record(value)) return undefined;
  if (value.type === CALENDAR_GRANULE_FEATURE &&
      ["year", "month", "day", "hour", "minute", "second"].includes(value.granularity as string) &&
      Number.isSafeInteger(value.displacement) &&
      (value.calendar === undefined || value.calendar === "gregorian")) {
    return value as QuantitativePayload;
  }
  if (value.type === ELAPSED_OFFSET_FEATURE &&
      (value.direction === "before" || value.direction === "after") &&
      Number.isSafeInteger(value.value) && (value.value as number) > 0 &&
      ["second", "minute", "hour"].includes(value.unit as string)) {
    return value as QuantitativePayload;
  }
  return undefined;
}

function validPayload(value: QuantitativePayload): boolean {
  return value.type === CALENDAR_GRANULE_FEATURE
    ? ["year", "month", "day", "hour", "minute", "second"].includes(value.granularity) &&
      Number.isSafeInteger(value.displacement) &&
      (value.calendar === undefined || value.calendar === "gregorian")
    : value.type === ELAPSED_OFFSET_FEATURE &&
      (value.direction === "before" || value.direction === "after") &&
      Number.isSafeInteger(value.value) && value.value > 0 &&
      ["second", "minute", "hour"].includes(value.unit);
}

export function getQuantitativeRelations(dataset: Dataset, eventId: string): Array<{ relation: Relation; payload: QuantitativePayload }> {
  if (!hasExactRelativeTimeDeclaration(dataset)) return [];
  return dataset.relations.flatMap((relation) => {
    if (relation.sourceId !== eventId && relation.targetId !== eventId) return [];
    if (!dataset.events.some(({ id }) => id === relation.sourceId) ||
        !dataset.events.some(({ id }) => id === relation.targetId)) return [];
    const payload = readQuantitativePayload(relation);
    return payload ? [{ relation, payload }] : [];
  });
}

export function canCreateQuantitative(dataset: Dataset, feature: QuantitativePayload["type"]): boolean {
  return ensureRelativeTimeDeclaration(dataset, feature) !== undefined;
}

function validated(dataset: Dataset): QuantitativeResult {
  return validateCoreDataset(dataset).isValid
    ? { ok: true, dataset }
    : { ok: false, reason: "invalid" };
}

function removeUnusedFeature(dataset: Dataset): Dataset {
  const specification = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  if (!record(specification) || !Array.isArray(specification.uses)) return dataset;
  const used = new Set(dataset.relations.flatMap((relation) => {
    const payload = relation.extensions?.[RELATIVE_TIME_EXTENSION_ID];
    return record(payload) && typeof payload.type === "string" ? [payload.type] : [];
  }));
  const uses = specification.uses.flatMap((use) => {
    if (!record(use) || use.extension !== RELATIVE_TIME_EXTENSION_ID ||
        use.version !== RELATIVE_TIME_VERSION || !Array.isArray(use.features)) return [use];
    if (used.size === 0) return [];
    return [{ ...use, features: use.features.filter((feature) => used.has(feature as string)) }];
  });
  return {
    ...dataset,
    extensions: {
      ...dataset.extensions,
      [SPECIFICATION_EXTENSION_ID]: { ...specification, uses },
    },
  };
}

export function applyQuantitativeOperation(dataset: Dataset, operation: QuantitativeOperation): QuantitativeResult {
  if (operation.type === "create") {
    if (!validPayload(operation.payload) || operation.sourceId === operation.targetId ||
        !dataset.events.some(({ id }) => id === operation.sourceId) ||
        !dataset.events.some(({ id }) => id === operation.targetId) ||
        [dataset, ...dataset.entities, ...dataset.events, ...dataset.relations].some(({ id }) => id === operation.relationId)) {
      return { ok: false, reason: "unsupported" };
    }
    // Initial authoring is one assertion of each quantitative family per directed pair.
    // Independently imported Relations are left untouched and remain visible.
    if (dataset.relations.some((relation) =>
        ((relation.sourceId === operation.sourceId && relation.targetId === operation.targetId) ||
         (relation.sourceId === operation.targetId && relation.targetId === operation.sourceId)) &&
        readQuantitativePayload(relation)?.type === operation.payload.type)) {
      return { ok: false, reason: "unsupported" };
    }
    const prepared = ensureRelativeTimeDeclaration(dataset, operation.payload.type);
    if (!prepared) return { ok: false, reason: "unsupported" };
    return validated({
      ...prepared,
      relations: [...prepared.relations, {
        id: operation.relationId,
        sourceId: operation.sourceId,
        targetId: operation.targetId,
        extensions: { [RELATIVE_TIME_EXTENSION_ID]: operation.payload },
      }],
    });
  }
  if (!hasExactRelativeTimeDeclaration(dataset)) return { ok: false, reason: "unsupported" };
  const relation = dataset.relations.find(({ id }) => id === operation.relationId);
  const previous = relation && readQuantitativePayload(relation);
  if (!relation || !previous) return { ok: false, reason: "unsupported" };
  if (operation.type === "update") {
    if (!validPayload(operation.payload) || operation.payload.type !== previous.type) {
      return { ok: false, reason: "unsupported" };
    }
    const priorPayload = relation.extensions?.[RELATIVE_TIME_EXTENSION_ID];
    if (!record(priorPayload)) return { ok: false, reason: "unsupported" };
    return validated({
      ...dataset,
      relations: dataset.relations.map((item) => item.id === relation.id
        ? { ...item, extensions: { ...item.extensions, [RELATIVE_TIME_EXTENSION_ID]: { ...priorPayload, ...operation.payload } } }
        : item),
    });
  }
  // Deleting a Relation with other payloads would destroy independently owned data.
  if (Object.keys(relation.extensions ?? {}).some((id) => id !== RELATIVE_TIME_EXTENSION_ID)) {
    return { ok: false, reason: "unsupported" };
  }
  return validated(removeUnusedFeature({
    ...dataset,
    relations: dataset.relations.filter(({ id }) => id !== relation.id),
  }));
}
