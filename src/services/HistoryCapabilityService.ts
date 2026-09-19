import type { Dataset } from "../models/Dataset";
import type { Event } from "../models/Event";

export const HISTORY_EXTENSION_ID = "history";
export const STABLE_HISTORY_VERSION = "1.0.0";
export const HISTORY_2_CANDIDATE_VERSION = "2.0.0";
export const SPECIFICATION_EXTENSION_ID =
  "draft.github.sukoyaka-dopeness.specification";

export type HistoryCapability =
  | "none"
  | "stable"
  | "candidate"
  | "unsupported"
  | "unknown"
  | "mixed";

export type HistoryEditPolicy = "editable" | "read-only";

export interface HistoryCapabilityResult {
  capability: HistoryCapability;
  editPolicy: HistoryEditPolicy;
}

type JsonRecord = Record<string, unknown>;

type HistoryDeclaration =
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "declared"; version: string; features: string[] };

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function onlyKnownKeys(value: JsonRecord, knownKeys: readonly string[]): boolean {
  return Object.keys(value).every((key) => knownKeys.includes(key));
}

function readHistoryDeclaration(dataset: Dataset): HistoryDeclaration {
  const specification = dataset.extensions?.[SPECIFICATION_EXTENSION_ID];
  if (specification === undefined) return { status: "absent" };
  if (!isRecord(specification) || !Array.isArray(specification.uses)) {
    return { status: "invalid" };
  }

  const historyUses = specification.uses.filter(
    (use) => isRecord(use) && use.extension === HISTORY_EXTENSION_ID,
  );
  if (historyUses.length === 0) return { status: "absent" };
  if (historyUses.length !== 1 || !isRecord(historyUses[0])) {
    return { status: "invalid" };
  }

  const use = historyUses[0];
  if (typeof use.version !== "string") return { status: "invalid" };
  if (use.features === undefined) {
    return { status: "declared", version: use.version, features: [] };
  }
  if (
    !Array.isArray(use.features) ||
    !use.features.every((feature) => typeof feature === "string")
  ) {
    return { status: "invalid" };
  }

  return {
    status: "declared",
    version: use.version,
    features: use.features,
  };
}

function isTemporalPosition(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.year === "number" &&
    onlyKnownKeys(value, [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
      "timeZone",
      "offset",
      "approximation",
    ])
  );
}

function isTemporalBoundary(value: unknown): boolean {
  return (
    isRecord(value) &&
    ["occurred", "not-occurred", "unknown"].includes(
      value.occurrence as string,
    ) &&
    onlyKnownKeys(value, ["occurrence", "position"]) &&
    (value.position === undefined || isTemporalPosition(value.position))
  );
}

function isKnownCandidateAssertion(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== "string") return false;

  if (value.type === "position") {
    return (
      isTemporalPosition(value.position) &&
      onlyKnownKeys(value, ["id", "type", "position", "temporalOrder"])
    );
  }

  if (value.type === "bounded-point") {
    return (
      isTemporalPosition(value.earliest) &&
      isTemporalPosition(value.latest) &&
      onlyKnownKeys(value, ["id", "type", "earliest", "latest"])
    );
  }

  if (value.type === "temporal-extent") {
    return (
      isTemporalBoundary(value.start) &&
      isTemporalBoundary(value.end) &&
      onlyKnownKeys(value, ["id", "type", "start", "end"])
    );
  }

  return false;
}

function expectedCandidateFeatures(payload: JsonRecord): string[] | undefined {
  if (!Array.isArray(payload.assertions) || payload.assertions.length === 0) {
    return undefined;
  }

  const features = new Set<string>();
  if (payload.assertions.length > 1) features.add("multiple-assertions");

  for (const assertion of payload.assertions) {
    if (!isRecord(assertion)) return undefined;
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

function isExactCandidatePayload(
  payload: JsonRecord,
  declaration: HistoryDeclaration,
  declaredDatasetFeatures?: string[],
): boolean {
  if (
    declaration.status !== "declared" ||
    declaration.version !== HISTORY_2_CANDIDATE_VERSION ||
    !onlyKnownKeys(payload, ["assertions"]) ||
    !Array.isArray(payload.assertions) ||
    payload.assertions.length === 0 ||
    !payload.assertions.every(isKnownCandidateAssertion)
  ) {
    return false;
  }

  const expectedFeatures = declaredDatasetFeatures ?? expectedCandidateFeatures(payload);
  return (
    expectedFeatures !== undefined &&
    JSON.stringify([...declaration.features].sort()) ===
      JSON.stringify(expectedFeatures)
  );
}

function result(capability: HistoryCapability): HistoryCapabilityResult {
  return {
    capability,
    editPolicy: capability === "none" || capability === "stable"
      ? "editable"
      : "read-only",
  };
}

export function classifyHistoryPayload(
  payload: unknown,
  declaration: HistoryDeclaration = { status: "absent" },
): HistoryCapabilityResult {
  if (payload === undefined) return result("none");
  if (!isRecord(payload)) return result("unsupported");

  const hasTime = hasOwn(payload, "time");
  const hasAssertions = hasOwn(payload, "assertions");
  if (hasTime && hasAssertions) return result("mixed");

  if (hasTime) {
    const stableDeclaration =
      declaration.status === "absent" ||
      (declaration.status === "declared" &&
        declaration.version === STABLE_HISTORY_VERSION);
    return stableDeclaration && isRecord(payload.time) && onlyKnownKeys(payload, ["time"])
      ? result("stable")
      : result(declaration.status === "declared" ? "unsupported" : "unknown");
  }

  if (hasAssertions) {
    return isExactCandidatePayload(payload, declaration)
      ? result("candidate")
      : result("unknown");
  }

  return result("unknown");
}

export function classifyHistoryCapability(
  dataset: Dataset,
  event: Event | null | undefined,
): HistoryCapabilityResult {
  if (!event) return result("none");
  const payload = event.extensions?.[HISTORY_EXTENSION_ID];
  const declaration = readHistoryDeclaration(dataset);
  const payloadResult = classifyHistoryPayload(payload, declaration);
  if (payloadResult.capability === "mixed") return payloadResult;
  if (!isRecord(payload)) return result(payloadResult.capability);

  if (
    declaration.status === "declared" &&
    declaration.version === HISTORY_2_CANDIDATE_VERSION
  ) {
    const datasetFeatures = new Set<string>();
    const candidateEvents = dataset.events.filter(
      (candidate) => candidate.extensions?.[HISTORY_EXTENSION_ID] !== undefined,
    );

    for (const candidate of candidateEvents) {
      const candidatePayload = candidate.extensions?.[HISTORY_EXTENSION_ID];
      const stableResult = classifyHistoryPayload(candidatePayload, {
        status: "declared",
        version: STABLE_HISTORY_VERSION,
        features: [],
      });
      if (stableResult.capability === "stable") continue;
      if (
        !isRecord(candidatePayload) ||
        !onlyKnownKeys(candidatePayload, ["assertions"]) ||
        !Array.isArray(candidatePayload.assertions) ||
        candidatePayload.assertions.length === 0 ||
        !candidatePayload.assertions.every(isKnownCandidateAssertion)
      ) {
        return result("unknown");
      }
      for (const feature of expectedCandidateFeatures(candidatePayload) ?? []) {
        datasetFeatures.add(feature);
      }
    }

    const targetStableResult = classifyHistoryPayload(payload, {
      status: "declared",
      version: STABLE_HISTORY_VERSION,
      features: [],
    });
    if (targetStableResult.capability === "stable") return targetStableResult;

    return isExactCandidatePayload(payload, declaration, [...datasetFeatures].sort())
      ? result("candidate")
      : result("unknown");
  }

  return classifyHistoryPayload(payload, declaration);
}

export function isHistoryPayloadStable(payload: unknown): boolean {
  return classifyHistoryPayload(payload).capability === "stable";
}

export function isHistoryEditable(
  capability: HistoryCapabilityResult,
): boolean {
  return capability.editPolicy === "editable";
}
