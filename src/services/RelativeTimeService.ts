import type { Dataset } from "../models/Dataset";
import type { Event } from "../models/Event";
import type { Relation } from "../models/Relation";
import { createCoreObjectId } from "./IdentifierService.ts";
import { getEventHistoryTime } from "./HistoryService.ts";
import { getHistory2PositionEditorValues } from "./History2Service.ts";
import {
  getCompleteSupportedExtensionUses,
  SPECIFICATION_EXTENSION_ID,
  SPECIFICATION_EXTENSION_VERSION,
} from "./SpecificationDeclarationService.ts";
import { validateCoreDataset } from "./ValidationService.ts";

export const RELATIVE_TIME_EXTENSION_ID =
  "draft.github.sukoyaka-dopeness.relative-time";
export const RELATIVE_TIME_VERSION = "0.2.0";
export const RELATIVE_POSITION_FEATURE = "relative-position";

export type RelativePosition = "before" | "after";
export type RelativeTimeResult =
  | { ok: true; dataset: Dataset }
  | { ok: false; reason: "unsupported_dataset" | "contradiction" | "invalid_dataset" };

export type RelativeTimeOperation =
  | {
      type: "create";
      currentEventId: string;
      otherEventId: string;
      currentBeforeOther: boolean;
      relationId: string;
    }
  | {
      type: "update";
      relationId: string;
      currentEventId: string;
      currentBeforeOther: boolean;
    };

export interface RelativeTimeAssertion {
  relation: Relation;
  value: RelativePosition;
  otherEventId: string;
  currentBeforeOther: boolean;
}

export interface RelativeTimeProjectionGroup {
  eventIdsByDisplayBand: string[][];
  assertions: Array<{ earlierEventId: string; laterEventId: string }>;
  incomparablePairs: Array<[string, string]>;
}

export interface RelativeTimeProjection {
  groups: RelativeTimeProjectionGroup[];
  conflictedEventIds: string[][];
}

export type RelativeTimeEvidenceState = "off" | "on" | "diagnostic";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Classify Dataset evidence for presentation without changing authoring safety. */
export function classifyRelativeTimeEvidence(dataset: Dataset): RelativeTimeEvidenceState {
  const relativeObjects = [dataset, ...dataset.entities, ...dataset.events, ...dataset.relations];
  const payloads = relativeObjects.flatMap((object) => {
    const payload = object.extensions?.[RELATIVE_TIME_EXTENSION_ID];
    return payload === undefined ? [] : [{ object, payload }];
  });
  const specification = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  const declared = isRecord(specification) && Array.isArray(specification.uses) &&
    specification.uses.some((use) => isRecord(use) && use.extension === RELATIVE_TIME_EXTENSION_ID);

  if (payloads.length === 0 && !declared) return "off";
  if (payloads.length === 0 || !supportsRelativeTimeAuthoring(dataset)) return "diagnostic";

  const knownFeatures = new Set(RELATIVE_TIME_FEATURES);
  const actualFeatures = usedRelativeTimeFeatures(dataset);
  if (!actualFeatures || [...actualFeatures].some((feature) => !knownFeatures.has(feature) || feature !== RELATIVE_POSITION_FEATURE)) {
    return "diagnostic";
  }
  const hasUnsupportedPayload = payloads.some(({ object, payload }) => {
    if (object !== dataset && !dataset.relations.includes(object as Relation)) return true;
    if (!isRecord(payload) || payload.type !== RELATIVE_POSITION_FEATURE ||
        (payload.relation !== "before" && payload.relation !== "after")) return true;
    const relation = object as Relation;
    return !dataset.events.some(({ id }) => id === relation.sourceId) ||
      !dataset.events.some(({ id }) => id === relation.targetId);
  });
  if (hasUnsupportedPayload) return "diagnostic";

  const usable = dataset.events.some((event) =>
    getEditableRelativeTimeAssertions(dataset, event.id).length > 0,
  );
  return usable ? "on" : "diagnostic";
}

function exactRelativeTimeUse(dataset: Dataset): JsonRecord | undefined {
  const specification = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  if (
    !isRecord(specification) ||
    specification.specVersion !== SPECIFICATION_EXTENSION_VERSION ||
    !Array.isArray(specification.uses)
  ) {
    return undefined;
  }
  const uses = specification.uses.filter(
    (use): use is JsonRecord => isRecord(use) &&
      use.extension === RELATIVE_TIME_EXTENSION_ID,
  );
  if (uses.length !== 1 || uses[0].version !== RELATIVE_TIME_VERSION) {
    return undefined;
  }
  if (
    !Array.isArray(uses[0].features) ||
    !uses[0].features.includes(RELATIVE_POSITION_FEATURE)
  ) {
    return undefined;
  }
  return uses[0];
}

export function supportsRelativeTimeAuthoring(dataset: Dataset): boolean {
  return exactRelativeTimeUse(dataset) !== undefined &&
    ensureRelativeTimeDeclaration(dataset) !== undefined;
}

export function canStartRelativeTimeAuthoring(dataset: Dataset): boolean {
  return ensureRelativeTimeDeclaration(dataset) !== undefined;
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasCompleteUseCoverage(dataset: Dataset, specification: JsonRecord): boolean {
  if (!Array.isArray(specification.uses)) return false;
  const counts = new Map<string, number>();
  for (const use of specification.uses) {
    if (
      !isRecord(use) || typeof use.extension !== "string" ||
      typeof use.version !== "string" ||
      (use.features !== undefined &&
        (!Array.isArray(use.features) || !use.features.every((item) => typeof item === "string")))
    ) return false;
    counts.set(use.extension, (counts.get(use.extension) ?? 0) + 1);
  }
  if ([...counts.values()].some((count) => count !== 1)) return false;

  const used = new Set<string>();
  for (const object of [dataset, ...dataset.entities, ...dataset.events, ...dataset.relations]) {
    for (const [id, payload] of Object.entries(object.extensions ?? {})) {
      if (id !== SPECIFICATION_EXTENSION_ID && payload !== undefined) used.add(id);
    }
  }
  return [...used].every((id) => counts.get(id) === 1);
}

const RELATIVE_TIME_FEATURES = new Set([
  "relative-position",
  "containment",
  "interval-topology",
  "calendar-granule-relation",
  "elapsed-offset",
]);

function usedRelativeTimeFeatures(dataset: Dataset): Set<string> | undefined {
  const features = new Set<string>();
  for (const relation of dataset.relations) {
    const payload = relation.extensions?.[RELATIVE_TIME_EXTENSION_ID];
    if (payload === undefined) continue;
    if (!isRecord(payload) || typeof payload.type !== "string" ||
        !RELATIVE_TIME_FEATURES.has(payload.type)) return undefined;
    features.add(payload.type);
  }
  return features;
}

export function isRelativeTimeProjectionEligibleEvent(
  dataset: Dataset,
  event: Event,
): boolean {
  // The current display-only Timeline projection remains limited to truly
  // undated, History-free Events. This boundary does not limit Recorded
  // Relative Time authoring or presentation in Event Detail.
  return (
    event.extensions?.history === undefined &&
    getEventHistoryTime(event) === undefined &&
    getHistory2PositionEditorValues(dataset, event) === undefined &&
    !hasOwn(event, "date")
  );
}

function readRelativePosition(relation: Relation): RelativePosition | undefined {
  const payload = relation.extensions?.[RELATIVE_TIME_EXTENSION_ID];
  if (
    isRecord(payload) &&
    payload.type === RELATIVE_POSITION_FEATURE &&
    (payload.relation === "before" || payload.relation === "after")
  ) {
    return payload.relation;
  }
  return undefined;
}

function isDeclaredExactRelativeTimePayload(dataset: Dataset): boolean {
  return exactRelativeTimeUse(dataset) !== undefined;
}

export function getEditableRelativeTimeAssertions(
  dataset: Dataset,
  eventId: string,
): RelativeTimeAssertion[] {
  if (!supportsRelativeTimeAuthoring(dataset)) return [];
  const event = dataset.events.find(({ id }) => id === eventId);
  if (!event) return [];

  return dataset.relations.flatMap((relation) => {
    const value = readRelativePosition(relation);
    if (value === undefined) return [];
    const isSource = relation.sourceId === eventId;
    const isTarget = relation.targetId === eventId;
    if (!isSource && !isTarget) return [];
    const otherEventId = isSource ? relation.targetId : relation.sourceId;
    const otherEvent = dataset.events.find(({ id }) => id === otherEventId);
    if (!otherEvent) return [];
    return [{
      relation,
      value,
      otherEventId,
      currentBeforeOther: isSource ? value === "after" : value === "before",
    }];
  });
}

function ensureRelativeTimeDeclaration(dataset: Dataset): Dataset | undefined {
  const uses = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  const existingRelativePayload = dataset.relations.some(
    (relation) => relation.extensions?.[RELATIVE_TIME_EXTENSION_ID] !== undefined,
  );

  if (uses === undefined) {
    if (existingRelativePayload) return undefined;
    const hasOtherExtensionUse = [
      dataset,
      ...dataset.entities,
      ...dataset.events,
      ...dataset.relations,
    ].some((object) =>
      Object.keys(object.extensions ?? {}).some((id) =>
        id !== SPECIFICATION_EXTENSION_ID && object.extensions?.[id] !== undefined,
      ),
    );
    const completeUses = hasOtherExtensionUse
      ? getCompleteSupportedExtensionUses(dataset)
      : [];
    if (!completeUses) return undefined;
    return {
      ...dataset,
      extensions: {
        ...(dataset.extensions ?? {}),
        [SPECIFICATION_EXTENSION_ID]: {
          specVersion: SPECIFICATION_EXTENSION_VERSION,
          uses: [
            ...completeUses,
            {
              extension: RELATIVE_TIME_EXTENSION_ID,
              version: RELATIVE_TIME_VERSION,
              features: [RELATIVE_POSITION_FEATURE],
            },
          ],
        },
      },
    };
  }

  if (!isRecord(uses) || uses.specVersion !== SPECIFICATION_EXTENSION_VERSION) {
    return undefined;
  }
  const useList = uses.uses;
  if (!Array.isArray(useList) || !hasCompleteUseCoverage(dataset, uses)) {
    return undefined;
  }
  const matching = useList.filter(
    (use): use is JsonRecord => isRecord(use) &&
      use.extension === RELATIVE_TIME_EXTENSION_ID,
  );
  if (matching.length > 1) return undefined;
  if (matching.length === 0) {
    if (existingRelativePayload) return undefined;
    return {
      ...dataset,
      extensions: {
        ...(dataset.extensions ?? {}),
        [SPECIFICATION_EXTENSION_ID]: {
          ...uses,
          uses: [
            ...useList,
            {
              extension: RELATIVE_TIME_EXTENSION_ID,
              version: RELATIVE_TIME_VERSION,
              features: [RELATIVE_POSITION_FEATURE],
            },
          ],
        },
      },
    };
  }

  const relativeUse = matching[0];
  if (
    relativeUse.version !== RELATIVE_TIME_VERSION ||
    !Array.isArray(relativeUse.features) ||
    !relativeUse.features.every((feature: unknown) => typeof feature === "string")
  ) {
    return undefined;
  }
  const actualFeatures = usedRelativeTimeFeatures(dataset);
  if (
    !actualFeatures ||
    JSON.stringify([...relativeUse.features].sort()) !==
      JSON.stringify([...actualFeatures].sort())
  ) return undefined;
  const features = [...new Set([
    ...relativeUse.features,
    RELATIVE_POSITION_FEATURE,
  ])].sort();
  return {
    ...dataset,
    extensions: {
      ...(dataset.extensions ?? {}),
      [SPECIFICATION_EXTENSION_ID]: {
        ...uses,
        uses: useList.map((use) =>
          isRecord(use) && use.extension === RELATIVE_TIME_EXTENSION_ID
            ? { ...use, features }
            : use,
        ),
      },
    },
  };
}

function finalizeMutation(dataset: Dataset): RelativeTimeResult {
  const after = validateCoreDataset(dataset);
  return after.isValid
    ? { ok: true, dataset }
    : { ok: false, reason: "invalid_dataset" };
}

function directOppositeExists(
  dataset: Dataset,
  currentEventId: string,
  otherEventId: string,
  currentBeforeOther: boolean,
  exceptRelationId?: string,
): boolean {
  return dataset.relations.some((relation) => {
    if (relation.id === exceptRelationId) return false;
    const value = readRelativePosition(relation);
    if (value === undefined) return false;
    const samePair =
      (relation.sourceId === currentEventId && relation.targetId === otherEventId) ||
      (relation.sourceId === otherEventId && relation.targetId === currentEventId);
    if (!samePair) return false;
    const relationCurrentBeforeOther = relation.sourceId === currentEventId
      ? value === "after"
      : value === "before";
    return relationCurrentBeforeOther !== currentBeforeOther;
  });
}

export function createRelativeTimeAssertion(
  dataset: Dataset,
  currentEventId: string,
  otherEventId: string,
  currentBeforeOther: boolean,
  relationId = createCoreObjectId(dataset),
): RelativeTimeResult {
  const current = dataset.events.find(({ id }) => id === currentEventId);
  const other = dataset.events.find(({ id }) => id === otherEventId);
  if (
    !current || !other || current.id === other.id
  ) {
    return { ok: false, reason: "unsupported_dataset" };
  }

  const relativeRelations = dataset.relations.filter((relation) =>
    (relation.sourceId === currentEventId && relation.targetId === otherEventId) ||
    (relation.sourceId === otherEventId && relation.targetId === currentEventId),
  ).filter((relation) => readRelativePosition(relation) !== undefined);
  if (directOppositeExists(dataset, currentEventId, otherEventId, currentBeforeOther)) {
    return { ok: false, reason: "contradiction" };
  }
  if (relativeRelations.length > 0) {
    return { ok: false, reason: "unsupported_dataset" };
  }

  let candidate = dataset;
  if (!supportsRelativeTimeAuthoring(dataset)) {
    const declared = ensureRelativeTimeDeclaration(dataset);
    if (!declared) return { ok: false, reason: "unsupported_dataset" };
    candidate = declared;
  }
  const relation: Relation = {
    id: relationId,
    sourceId: currentEventId,
    targetId: otherEventId,
    extensions: {
      [RELATIVE_TIME_EXTENSION_ID]: {
        type: RELATIVE_POSITION_FEATURE,
        relation: currentBeforeOther ? "after" : "before",
      },
    },
  };
  return finalizeMutation({
    ...candidate,
    relations: [...candidate.relations, relation],
  });
}

export function applyRelativeTimeOperation(
  dataset: Dataset,
  operation: RelativeTimeOperation,
): RelativeTimeResult {
  return operation.type === "create"
    ? createRelativeTimeAssertion(
        dataset,
        operation.currentEventId,
        operation.otherEventId,
        operation.currentBeforeOther,
        operation.relationId,
      )
    : updateRelativeTimeAssertion(
        dataset,
        operation.relationId,
        operation.currentEventId,
        operation.currentBeforeOther,
      );
}

export function updateRelativeTimeAssertion(
  dataset: Dataset,
  relationId: string,
  currentEventId: string,
  currentBeforeOther: boolean,
): RelativeTimeResult {
  if (!supportsRelativeTimeAuthoring(dataset)) {
    return { ok: false, reason: "unsupported_dataset" };
  }
  const relation = dataset.relations.find(({ id }) => id === relationId);
  if (!relation || readRelativePosition(relation) === undefined) {
    return { ok: false, reason: "unsupported_dataset" };
  }
  const isSource = relation.sourceId === currentEventId;
  const isTarget = relation.targetId === currentEventId;
  const otherEventId = isSource ? relation.targetId : relation.sourceId;
  const current = dataset.events.find(({ id }) => id === currentEventId);
  const other = dataset.events.find(({ id }) => id === otherEventId);
  if (
    (!isSource && !isTarget) || !current || !other
  ) {
    return { ok: false, reason: "unsupported_dataset" };
  }
  if (directOppositeExists(dataset, currentEventId, otherEventId, currentBeforeOther, relationId)) {
    return { ok: false, reason: "contradiction" };
  }

  const existingPayload = relation.extensions?.[RELATIVE_TIME_EXTENSION_ID];
  if (!isRecord(existingPayload)) return { ok: false, reason: "unsupported_dataset" };
  const nextValue: RelativePosition = isSource
    ? currentBeforeOther ? "after" : "before"
    : currentBeforeOther ? "before" : "after";
  const nextRelation = {
    ...relation,
    extensions: {
      ...(relation.extensions ?? {}),
      [RELATIVE_TIME_EXTENSION_ID]: {
        ...existingPayload,
        type: RELATIVE_POSITION_FEATURE,
        relation: nextValue,
      },
    },
  };
  return finalizeMutation({
    ...dataset,
    relations: dataset.relations.map((item) =>
      item.id === relationId ? nextRelation : item,
    ),
  });
}

function directedEdges(dataset: Dataset): Array<[string, string]> {
  if (!isDeclaredExactRelativeTimePayload(dataset)) return [];
  const eligible = new Set(
    dataset.events.filter((event) => isRelativeTimeProjectionEligibleEvent(dataset, event))
      .map(({ id }) => id),
  );
  const unique = new Map<string, [string, string]>();
  for (const relation of dataset.relations) {
    const value = readRelativePosition(relation);
    if (
      value === undefined || relation.sourceId === relation.targetId ||
      !eligible.has(relation.sourceId) || !eligible.has(relation.targetId)
    ) continue;
    // `before`: target precedes source. `after`: target follows source.
    const edge: [string, string] = value === "before"
      ? [relation.targetId, relation.sourceId]
      : [relation.sourceId, relation.targetId];
    unique.set(`${edge[0]}\u0000${edge[1]}`, edge);
  }
  return [...unique.values()];
}

export function projectRelativeTimeForTimeline(dataset: Dataset): RelativeTimeProjection {
  const edges = directedEdges(dataset);
  const neighbors = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  const nodes = new Set<string>();
  for (const [from, to] of edges) {
    nodes.add(from);
    nodes.add(to);
    if (!neighbors.has(from)) neighbors.set(from, new Set());
    if (!neighbors.has(to)) neighbors.set(to, new Set());
    neighbors.get(from)!.add(to);
    neighbors.get(to)!.add(from);
    if (!outgoing.has(from)) outgoing.set(from, new Set());
    outgoing.get(from)!.add(to);
  }

  const components: string[][] = [];
  const visited = new Set<string>();
  for (const start of nodes) {
    if (visited.has(start)) continue;
    const component: string[] = [];
    const queue = [start];
    visited.add(start);
    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const next of neighbors.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    components.push(component);
  }

  const groups: RelativeTimeProjectionGroup[] = [];
  const conflictedEventIds: string[][] = [];
  for (const component of components) {
    const componentSet = new Set(component);
    const indegree = new Map(component.map((id) => [id, 0]));
    for (const [from, to] of edges) {
      if (componentSet.has(from) && componentSet.has(to)) {
        indegree.set(to, (indegree.get(to) ?? 0) + 1);
      }
    }
    const queue = component.filter((id) => indegree.get(id) === 0);
    const levels = new Map(component.map((id) => [id, 0]));
    let consumed = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      consumed += 1;
      for (const next of outgoing.get(current) ?? []) {
        if (!componentSet.has(next)) continue;
        levels.set(next, Math.max(levels.get(next) ?? 0, (levels.get(current) ?? 0) + 1));
        const nextDegree = (indegree.get(next) ?? 0) - 1;
        indegree.set(next, nextDegree);
        if (nextDegree === 0) queue.push(next);
      }
    }
    if (consumed !== component.length) {
      conflictedEventIds.push(component);
      continue;
    }

    const baseIndex = new Map(dataset.events.map((event, index) => [event.id, index]));
    const maxLevel = Math.max(...levels.values());
    const eventIdsByDisplayBand = Array.from({ length: maxLevel + 1 }, (_, level) =>
      component.filter((id) => levels.get(id) === level).sort((left, right) =>
        (baseIndex.get(left) ?? 0) - (baseIndex.get(right) ?? 0) || left.localeCompare(right),
      ),
    );
    const reachable = (from: string, to: string): boolean => {
      const seen = new Set<string>([from]);
      const pending = [from];
      while (pending.length > 0) {
        const current = pending.pop()!;
        for (const next of outgoing.get(current) ?? []) {
          if (next === to) return true;
          if (!seen.has(next)) {
            seen.add(next);
            pending.push(next);
          }
        }
      }
      return false;
    };
    const incomparablePairs: Array<[string, string]> = [];
    for (let left = 0; left < component.length; left += 1) {
      for (let right = left + 1; right < component.length; right += 1) {
        const a = component[left];
        const b = component[right];
        if (!reachable(a, b) && !reachable(b, a)) incomparablePairs.push([a, b]);
      }
    }
    const assertions = edges.flatMap(([earlierEventId, laterEventId]) =>
      componentSet.has(earlierEventId) && componentSet.has(laterEventId)
        ? [{ earlierEventId, laterEventId }]
        : [],
    );
    groups.push({ eventIdsByDisplayBand, assertions, incomparablePairs });
  }

  return { groups, conflictedEventIds };
}
