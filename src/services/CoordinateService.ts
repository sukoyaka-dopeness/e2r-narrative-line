import type { CoreObject } from "../models/CoreObject";
import type { Dataset } from "../models/Dataset";

export const COORDINATE_EXTENSION_ID =
  "experimental.github.sukoyaka-dopeness.coordinate";
export const COORDINATE_FORMAT_VERSION = "0.1.0";
export const LIAISONSCAPE_SPACE_ID = "liaisonscape-graph";
export const LIAISONSCAPE_UNIT = "liaisonscape-user-unit";
export const LEGACY_LINKSCAPE_SPACE_ID = "linkscape-graph";
export const LEGACY_LINKSCAPE_UNIT = "linkscape-user-unit";

export type CoordinateReadStatus =
  | "absent"
  | "available"
  | "unsupported"
  | "invalid";

export interface InterpretedCoordinateComponent {
  id: string;
  name?: string;
  unit?: string;
  positiveDirection?: string;
  minimum?: number;
  maximum?: number;
}

export interface InterpretedCoordinateValue
  extends InterpretedCoordinateComponent {
  value: number;
}

export interface InterpretedCoordinate {
  spaceId: string;
  spaceName?: string;
  kind?: string;
  values: InterpretedCoordinateValue[];
  missingComponents: InterpretedCoordinateComponent[];
}

export interface CoordinateReadResult {
  status: CoordinateReadStatus;
  coordinates: InterpretedCoordinate[];
}

export type CoordinateWriteStatus =
  | "updated"
  | "unchanged"
  | "object_not_found"
  | "coordinate_not_found"
  | "unsupported"
  | "invalid";

export interface CoordinateWriteResult {
  status: CoordinateWriteStatus;
  dataset: Dataset;
}

export function isCoordinateWriteSupported(
  coordinate: InterpretedCoordinate,
): boolean {
  const unit = coordinate.spaceId === LIAISONSCAPE_SPACE_ID
    ? LIAISONSCAPE_UNIT
    : coordinate.spaceId === LEGACY_LINKSCAPE_SPACE_ID
      ? LEGACY_LINKSCAPE_UNIT
      : null;
  if (!unit || coordinate.kind !== "cartesian-2d") {
    return false;
  }
  const components = new Map(
    [...coordinate.values, ...coordinate.missingComponents].map((component) => [
      component.id,
      component,
    ]),
  );
  const x = components.get("x");
  const y = components.get("y");
  return (
    coordinate.values.some(({ id }) => id === "x") &&
    coordinate.values.some(({ id }) => id === "y") &&
    x?.unit === unit &&
    x.positiveDirection === "display-right" &&
    y?.unit === unit &&
    y.positiveDirection === "display-down"
  );
}

type ParsedSpace = {
  id: string;
  name?: string;
  kind?: string;
  components: Map<string, InterpretedCoordinateComponent>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseSpaces(value: unknown): Map<string, ParsedSpace> | null {
  if (!Array.isArray(value)) return null;
  const spaces = new Map<string, ParsedSpace>();

  for (const candidate of value) {
    if (!isRecord(candidate)) return null;
    const id = optionalString(candidate.id);
    if (!id || spaces.has(id) || !isRecord(candidate.components)) return null;

    const componentEntries = Object.entries(candidate.components).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    if (componentEntries.length === 0) return null;
    const components = new Map<string, InterpretedCoordinateComponent>();
    for (const [componentId, componentValue] of componentEntries) {
      if (!componentId.trim() || !isRecord(componentValue)) return null;
      const minimum = optionalFiniteNumber(componentValue.minimum);
      const maximum = optionalFiniteNumber(componentValue.maximum);
      const period = optionalFiniteNumber(componentValue.period);
      if (
        ("minimum" in componentValue && minimum === undefined) ||
        ("maximum" in componentValue && maximum === undefined) ||
        ("period" in componentValue && (period === undefined || period <= 0)) ||
        (minimum !== undefined && maximum !== undefined && minimum > maximum)
      ) {
        return null;
      }
      components.set(componentId, {
        id: componentId,
        ...(optionalString(componentValue.name) === undefined
          ? {}
          : { name: optionalString(componentValue.name) }),
        ...(optionalString(componentValue.unit) === undefined
          ? {}
          : { unit: optionalString(componentValue.unit) }),
        ...(optionalString(componentValue.positiveDirection) === undefined
          ? {}
          : { positiveDirection: optionalString(componentValue.positiveDirection) }),
        ...(minimum === undefined ? {} : { minimum }),
        ...(maximum === undefined ? {} : { maximum }),
      });
    }

    spaces.set(id, {
      id,
      ...(optionalString(candidate.name) === undefined
        ? {}
        : { name: optionalString(candidate.name) }),
      ...(optionalString(candidate.kind) === undefined
        ? {}
        : { kind: optionalString(candidate.kind) }),
      components,
    });
  }

  return spaces;
}

export function readObjectCoordinates(
  dataset: Dataset,
  object: CoreObject,
): CoordinateReadResult {
  const objectExtensions = object.extensions;
  if (!isRecord(objectExtensions) || !(COORDINATE_EXTENSION_ID in objectExtensions)) {
    return { status: "absent", coordinates: [] };
  }

  const datasetExtensions = dataset.extensions;
  const datasetPayload = isRecord(datasetExtensions)
    ? datasetExtensions[COORDINATE_EXTENSION_ID]
    : undefined;
  if (!isRecord(datasetPayload)) {
    return { status: "invalid", coordinates: [] };
  }
  if (datasetPayload.formatVersion !== COORDINATE_FORMAT_VERSION) {
    return { status: "unsupported", coordinates: [] };
  }

  const spaces = parseSpaces(datasetPayload.spaces);
  const objectPayload = objectExtensions[COORDINATE_EXTENSION_ID];
  if (!spaces || !isRecord(objectPayload) || !Array.isArray(objectPayload.coordinates)) {
    return { status: "invalid", coordinates: [] };
  }

  const coordinates: InterpretedCoordinate[] = [];
  const seenSpaces = new Set<string>();
  for (const candidate of objectPayload.coordinates) {
    if (!isRecord(candidate)) return { status: "invalid", coordinates: [] };
    const spaceId = optionalString(candidate.spaceId);
    const space = spaceId ? spaces.get(spaceId) : undefined;
    if (!spaceId || !space || seenSpaces.has(spaceId) || !isRecord(candidate.values)) {
      return { status: "invalid", coordinates: [] };
    }

    const valuesRecord = candidate.values;
    const valueEntries = Object.entries(valuesRecord).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    if (valueEntries.length === 0) return { status: "invalid", coordinates: [] };
    const values: InterpretedCoordinateValue[] = [];
    for (const [componentId, componentValue] of valueEntries) {
      const component = space.components.get(componentId);
      if (
        !component ||
        typeof componentValue !== "number" ||
        !Number.isFinite(componentValue) ||
        (component.minimum !== undefined && componentValue < component.minimum) ||
        (component.maximum !== undefined && componentValue > component.maximum)
      ) {
        return { status: "invalid", coordinates: [] };
      }
      values.push({ ...component, value: componentValue });
    }

    seenSpaces.add(spaceId);
    coordinates.push({
      spaceId,
      ...(space.name === undefined ? {} : { spaceName: space.name }),
      ...(space.kind === undefined ? {} : { kind: space.kind }),
      values,
      missingComponents: [...space.components.values()].filter(
        ({ id }) => !(id in valuesRecord),
      ),
    });
  }

  return {
    status: coordinates.length === 0 ? "absent" : "available",
    coordinates,
  };
}

export function updateObjectCoordinate(
  dataset: Dataset,
  objectId: string,
  spaceId: string,
  updates: Record<string, number>,
): CoordinateWriteResult {
  const entityMatches = dataset.entities.filter(({ id }) => id === objectId);
  const eventMatches = dataset.events.filter(({ id }) => id === objectId);
  if (entityMatches.length === 0 && eventMatches.length === 1) {
    return { status: "unsupported", dataset };
  }
  if (entityMatches.length !== 1 || eventMatches.length !== 0) {
    return { status: "object_not_found", dataset };
  }

  const object = entityMatches[0];
  const readResult = readObjectCoordinates(dataset, object);
  if (readResult.status === "unsupported") {
    return { status: "unsupported", dataset };
  }
  if (readResult.status !== "available") {
    return { status: "invalid", dataset };
  }

  const interpreted = readResult.coordinates.find(
    (coordinate) => coordinate.spaceId === spaceId,
  );
  if (!interpreted) {
    return { status: "coordinate_not_found", dataset };
  }
  if (!isCoordinateWriteSupported(interpreted)) {
    return { status: "unsupported", dataset };
  }

  const componentById = new Map(
    interpreted.values.map((component) => [component.id, component]),
  );
  const updateEntries = Object.entries(updates);
  if (
    updateEntries.length === 0 ||
    updateEntries.some(([componentId, value]) => {
      const component = componentById.get(componentId);
      return (
        !component ||
        (componentId !== "x" && componentId !== "y") ||
        !Number.isFinite(value) ||
        (component.minimum !== undefined && value < component.minimum) ||
        (component.maximum !== undefined && value > component.maximum)
      );
    })
  ) {
    return { status: "invalid", dataset };
  }

  if (
    updateEntries.every(
      ([componentId, value]) => componentById.get(componentId)?.value === value,
    )
  ) {
    return { status: "unchanged", dataset };
  }

  const coordinateId = COORDINATE_EXTENSION_ID;
  const updateObject = (candidate: CoreObject): CoreObject => {
    if (candidate.id !== objectId || !isRecord(candidate.extensions)) {
      return candidate;
    }
    const payload = candidate.extensions[coordinateId];
    if (!isRecord(payload) || !Array.isArray(payload.coordinates)) {
      return candidate;
    }

    return {
      ...candidate,
      extensions: {
        ...candidate.extensions,
        [coordinateId]: {
          ...payload,
          coordinates: payload.coordinates.map((coordinate) => {
            if (!isRecord(coordinate) || coordinate.spaceId !== spaceId) {
              return coordinate;
            }
            return {
              ...coordinate,
              values: {
                ...(isRecord(coordinate.values) ? coordinate.values : {}),
                ...updates,
              },
            };
          }),
        },
      },
    };
  };

  return {
    status: "updated",
    dataset: {
      ...dataset,
      entities: dataset.entities.map(updateObject),
      events: dataset.events.map(updateObject),
    },
  };
}
