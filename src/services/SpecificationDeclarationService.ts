import type { CoreObject } from "../models/CoreObject";
import type { Dataset } from "../models/Dataset";
import {
  COORDINATE_EXTENSION_ID,
  COORDINATE_FORMAT_VERSION,
} from "./CoordinateService.ts";

export const SPECIFICATION_EXTENSION_ID =
  "draft.github.sukoyaka-dopeness.specification";
export const SPECIFICATION_EXTENSION_VERSION = "0.1.0";

const supportedVersions = new Map<string, string>([
  ["metadata", "1.0.0"],
  ["history", "1.0.0"],
  [COORDINATE_EXTENSION_ID, COORDINATE_FORMAT_VERSION],
]);

export type ExportSpecificationDeclarationResult =
  | { status: "added"; dataset: Dataset }
  | {
      status: "unchanged";
      dataset: Dataset;
      reason:
        | "no_extensions"
        | "no_writer_owned_extensions"
        | "existing_declaration"
        | "unsupported_extensions";
      unsupportedExtensionIds?: string[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectExtensionIds(dataset: Dataset): Set<string> {
  const ids = new Set<string>();
  const objects: CoreObject[] = [
    ...dataset.entities,
    ...dataset.events,
    ...dataset.relations,
  ];
  const containers: Array<Dataset | CoreObject> = [dataset, ...objects];

  for (const container of containers) {
    if (!isRecord(container.extensions)) {
      continue;
    }

    for (const [id, value] of Object.entries(container.extensions)) {
      if (value !== undefined) {
        ids.add(id);
      }
    }
  }

  return ids;
}

function coordinateVersionIsSupported(dataset: Dataset): boolean {
  const payload = dataset.extensions?.[COORDINATE_EXTENSION_ID];
  return (
    isRecord(payload) &&
    payload.formatVersion === COORDINATE_FORMAT_VERSION
  );
}

/**
 * Adds a complete Specification Extension declaration for newly exported data
 * only when NarrativeLine can state every used Extension version exactly.
 */
export function addExportSpecificationDeclaration(
  dataset: Dataset,
): ExportSpecificationDeclarationResult {
  const extensionIds = collectExtensionIds(dataset);

  if (extensionIds.has(SPECIFICATION_EXTENSION_ID)) {
    return {
      status: "unchanged",
      dataset,
      reason: "existing_declaration",
    };
  }

  if (extensionIds.size === 0) {
    return { status: "unchanged", dataset, reason: "no_extensions" };
  }

  if (!extensionIds.has("metadata") && !extensionIds.has("history")) {
    return {
      status: "unchanged",
      dataset,
      reason: "no_writer_owned_extensions",
    };
  }

  const unsupportedExtensionIds = [...extensionIds].filter(
    (id) =>
      !supportedVersions.has(id) ||
      (id === COORDINATE_EXTENSION_ID &&
        !coordinateVersionIsSupported(dataset)),
  );

  if (unsupportedExtensionIds.length > 0) {
    return {
      status: "unchanged",
      dataset,
      reason: "unsupported_extensions",
      unsupportedExtensionIds: unsupportedExtensionIds.sort(),
    };
  }

  const uses = [...supportedVersions]
    .filter(([id]) => extensionIds.has(id))
    .map(([extension, version]) => ({ extension, version }));

  return {
    status: "added",
    dataset: {
      ...dataset,
      extensions: {
        ...(dataset.extensions ?? {}),
        [SPECIFICATION_EXTENSION_ID]: {
          specVersion: SPECIFICATION_EXTENSION_VERSION,
          uses,
        },
      },
    },
  };
}
