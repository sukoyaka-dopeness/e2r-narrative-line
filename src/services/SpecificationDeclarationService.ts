import type { CoreObject } from "../models/CoreObject";
import type { Dataset } from "../models/Dataset";
import {
  COORDINATE_EXTENSION_ID,
  COORDINATE_FORMAT_VERSION,
} from "./CoordinateService.ts";
import {
  classifyHistoryCapability,
} from "./HistoryCapabilityService.ts";

export const SPECIFICATION_EXTENSION_ID =
  "draft.github.sukoyaka-dopeness.specification";
export const SPECIFICATION_EXTENSION_VERSION = "0.1.0";

const supportedVersions = new Map<string, string>([
  ["metadata", "1.0.0"],
  ["history", "1.0.0"],
  [COORDINATE_EXTENSION_ID, COORDINATE_FORMAT_VERSION],
]);

type HistoryDeclarationInfo = {
  version: string;
  features: string[];
};

export type SpecificationUse = {
  extension: string;
  version: string;
  features?: string[];
};

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

function historyCandidateFeatures(payload: Record<string, unknown>): string[] {
  if (!Array.isArray(payload.assertions)) return [];

  const features = new Set<string>();
  if (payload.assertions.length > 1) features.add("multiple-assertions");

  for (const assertion of payload.assertions) {
    if (!isRecord(assertion)) continue;
    if (assertion.type === "bounded-point") features.add("bounded-point");
    if (assertion.type === "temporal-extent") features.add("temporal-extent");

    const positions = [
      assertion.position,
      assertion.earliest,
      assertion.latest,
      isRecord(assertion.start) ? assertion.start.position : undefined,
      isRecord(assertion.end) ? assertion.end.position : undefined,
    ];
    if (
      positions.some(
        (position) => isRecord(position) && position.approximation !== undefined,
      )
    ) {
      features.add("approximation");
    }
  }

  return [...features].sort();
}

function getHistoryDeclarationInfo(
  dataset: Dataset,
): HistoryDeclarationInfo | undefined {
  const historyEvents = dataset.events.filter(
    (event) => event.extensions?.history !== undefined,
  );
  if (historyEvents.length === 0) return undefined;

  let sawStable = false;
  let sawCandidate = false;
  const features = new Set<string>();

  for (const event of historyEvents) {
    const capability = classifyHistoryCapability(dataset, event);
    if (capability.capability !== "stable" && capability.capability !== "candidate") {
      return undefined;
    }

    if (capability.capability === "stable") {
      sawStable = true;
    } else {
      sawCandidate = true;
      const payload = event.extensions?.history;
      if (isRecord(payload)) {
        for (const feature of historyCandidateFeatures(payload)) {
          features.add(feature);
        }
      }
    }
  }

  const version = sawCandidate ? "2.0.0" : sawStable ? "1.0.0" : undefined;
  return version === undefined
    ? undefined
    : { version, features: [...features].sort() };
}

export function getCompleteSupportedExtensionUses(
  dataset: Dataset,
): SpecificationUse[] | undefined {
  const extensionIds = collectExtensionIds(dataset);
  extensionIds.delete(SPECIFICATION_EXTENSION_ID);
  const historyDeclaration = getHistoryDeclarationInfo(dataset);

  if (
    extensionIds.size === 0 ||
    (!extensionIds.has("metadata") && !extensionIds.has("history"))
  ) {
    return undefined;
  }

  const unsupportedExtensionIds = [...extensionIds].filter(
    (id) =>
      !supportedVersions.has(id) ||
      (id === "history" && historyDeclaration === undefined) ||
      (id === COORDINATE_EXTENSION_ID &&
        !coordinateVersionIsSupported(dataset)),
  );
  if (unsupportedExtensionIds.length > 0) return undefined;

  return [...supportedVersions]
    .filter(([id]) => extensionIds.has(id))
    .map(([extension, version]) => {
      if (extension !== "history" || historyDeclaration === undefined) {
        return { extension, version };
      }
      return {
        extension,
        version: historyDeclaration.version,
        ...(historyDeclaration.features.length > 0
          ? { features: historyDeclaration.features }
          : {}),
      };
    });
}

/**
 * Adds a complete Specification Extension declaration for newly exported data
 * only when NarrativeLine can state every used Extension version exactly.
 */
export function addExportSpecificationDeclaration(
  dataset: Dataset,
): ExportSpecificationDeclarationResult {
  const extensionIds = collectExtensionIds(dataset);
  const historyDeclaration = getHistoryDeclarationInfo(dataset);

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
      (id === "history" && historyDeclaration === undefined) ||
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
    .map(([extension, version]) => {
      if (extension !== "history" || historyDeclaration === undefined) {
        return { extension, version };
      }

      return {
        extension,
        version: historyDeclaration.version,
        ...(historyDeclaration.features.length > 0
          ? { features: historyDeclaration.features }
          : {}),
      };
    });

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
