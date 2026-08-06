import type { Dataset } from "../models/Dataset";

export type CoreDatasetValidationCode =
  | "dataset_not_object"
  | "version_missing"
  | "version_invalid"
  | "entities_missing"
  | "entities_invalid"
  | "events_missing"
  | "events_invalid"
  | "relations_missing"
  | "relations_invalid"
  | "core_object_not_object"
  | "core_object_id_missing"
  | "core_object_id_invalid"
  | "core_object_id_duplicate"
  | "relation_source_id_missing"
  | "relation_source_id_invalid"
  | "relation_target_id_missing"
  | "relation_target_id_invalid"
  | "relation_source_unresolved"
  | "relation_target_unresolved"
  | "relation_source_is_relation"
  | "relation_target_is_relation";

export interface CoreDatasetValidationIssue {
  code: CoreDatasetValidationCode;
  path: string;
  relatedIds?: string[];
}

export interface CoreDatasetValidationResult {
  isValid: boolean;
  issues: CoreDatasetValidationIssue[];
  dataset?: Dataset;
}

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeJsonPointerSegment(segment: string | number): string {
  return String(segment).replace(/~/g, "~0").replace(/\//g, "~1");
}

function collectionPath(collection: string, index?: number): string {
  return index === undefined
    ? `/${escapeJsonPointerSegment(collection)}`
    : `/${escapeJsonPointerSegment(collection)}/${index}`;
}

function idPath(collection: string, index: number): string {
  return `${collectionPath(collection, index)}/id`;
}

function endpointPath(
  index: number,
  endpoint: "sourceId" | "targetId",
): string {
  return `/relations/${index}/${endpoint}`;
}

function validateCoreObject(
  value: unknown,
  collection: "entities" | "events" | "relations",
  index: number,
  issues: CoreDatasetValidationIssue[],
): string | undefined {
  if (!isJsonObject(value)) {
    issues.push({
      code: "core_object_not_object",
      path: collectionPath(collection, index),
    });
    return undefined;
  }

  if (!("id" in value)) {
    issues.push({
      code: "core_object_id_missing",
      path: idPath(collection, index),
    });
    return undefined;
  }

  if (!isNonEmptyString(value.id)) {
    issues.push({
      code: "core_object_id_invalid",
      path: idPath(collection, index),
    });
    return undefined;
  }

  return value.id;
}

function validateRelationEndpoint(
  relation: JsonObject,
  index: number,
  endpoint: "sourceId" | "targetId",
  issues: CoreDatasetValidationIssue[],
): string | undefined {
  const missingCode =
    endpoint === "sourceId"
      ? "relation_source_id_missing"
      : "relation_target_id_missing";
  const invalidCode =
    endpoint === "sourceId"
      ? "relation_source_id_invalid"
      : "relation_target_id_invalid";

  if (!(endpoint in relation)) {
    issues.push({ code: missingCode, path: endpointPath(index, endpoint) });
    return undefined;
  }

  if (!isNonEmptyString(relation[endpoint])) {
    issues.push({ code: invalidCode, path: endpointPath(index, endpoint) });
    return undefined;
  }

  return relation[endpoint];
}

export function validateCoreDataset(value: unknown): CoreDatasetValidationResult {
  const issues: CoreDatasetValidationIssue[] = [];

  if (!isJsonObject(value)) {
    return {
      isValid: false,
      issues: [{ code: "dataset_not_object", path: "" }],
    };
  }

  if (!("version" in value)) {
    issues.push({ code: "version_missing", path: "/version" });
  } else if (!isNonEmptyString(value.version)) {
    issues.push({ code: "version_invalid", path: "/version" });
  }

  const collections = ["entities", "events", "relations"] as const;
  const validCollections = new Map<
    (typeof collections)[number],
    unknown[]
  >();

  for (const collection of collections) {
    if (!(collection in value)) {
      issues.push({
        code: `${collection}_missing` as CoreDatasetValidationCode,
        path: collectionPath(collection),
      });
    } else if (!Array.isArray(value[collection])) {
      issues.push({
        code: `${collection}_invalid` as CoreDatasetValidationCode,
        path: collectionPath(collection),
      });
    } else {
      validCollections.set(collection, value[collection]);
    }
  }

  const objectIds = new Set<string>();
  const entityAndEventIds = new Set<string>();
  const relationIds = new Set<string>();

  for (const collection of collections) {
    const objects = validCollections.get(collection) ?? [];

    objects.forEach((object, index) => {
      const objectId = validateCoreObject(object, collection, index, issues);

      if (!objectId) {
        return;
      }

      if (objectIds.has(objectId)) {
        issues.push({
          code: "core_object_id_duplicate",
          path: idPath(collection, index),
          relatedIds: [objectId],
        });
        return;
      }

      objectIds.add(objectId);

      if (collection === "relations") {
        relationIds.add(objectId);
      } else {
        entityAndEventIds.add(objectId);
      }
    });
  }

  const relations = validCollections.get("relations") ?? [];

  relations.forEach((relation, index) => {
    if (!isJsonObject(relation)) {
      return;
    }

    for (const endpoint of ["sourceId", "targetId"] as const) {
      const endpointId = validateRelationEndpoint(
        relation,
        index,
        endpoint,
        issues,
      );

      if (!endpointId) {
        continue;
      }

      if (relationIds.has(endpointId)) {
        issues.push({
          code:
            endpoint === "sourceId"
              ? "relation_source_is_relation"
              : "relation_target_is_relation",
          path: endpointPath(index, endpoint),
          relatedIds: [endpointId],
        });
      } else if (!entityAndEventIds.has(endpointId)) {
        issues.push({
          code:
            endpoint === "sourceId"
              ? "relation_source_unresolved"
              : "relation_target_unresolved",
          path: endpointPath(index, endpoint),
          relatedIds: [endpointId],
        });
      }
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    ...(issues.length === 0 ? { dataset: value as Dataset } : {}),
  };
}
