import type { Dataset } from "../models/Dataset";

export const RESEARCH_P1_NAMES_EXTENSION_ID = "research.fixture.p1-names";

export type P1DiscoveryMatch = {
  entityId: string;
  expressionId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Research-only exact discovery over an imported NarrativeLine Dataset.
 * This intentionally performs no normalization, ranking, or equivalence.
 */
export function discoverResearchP1Expressions(
  dataset: Dataset,
  query: string,
): P1DiscoveryMatch[] {
  const matches: P1DiscoveryMatch[] = [];

  for (const entity of dataset.entities) {
    const extensions = entity.extensions;
    if (!isRecord(extensions)) continue;

    const payload = extensions[RESEARCH_P1_NAMES_EXTENSION_ID];
    if (!isRecord(payload) || !Array.isArray(payload.expressions)) continue;

    for (const expression of payload.expressions) {
      if (!isRecord(expression)
        || typeof expression.id !== "string"
        || typeof expression.value !== "string") continue;
      if (expression.value === query) {
        matches.push({ entityId: entity.id, expressionId: expression.id });
      }
    }
  }

  return matches;
}
