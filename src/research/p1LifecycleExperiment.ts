import type { Dataset } from "../models/Dataset";
import { RESEARCH_P1_NAMES_EXTENSION_ID } from "./p1NameExpressionDiscovery.ts";

type ResearchExpression = Record<string, unknown> & {
  id: string;
  value: string;
};

type LifecycleOperation =
  | {
      kind: "pre-classified-non-substantive";
      entityId: string;
      expressionId: string;
      replacement: ResearchExpression;
    }
  | {
      kind: "pre-classified-substantive-replacement";
      entityId: string;
      expressionId: string;
      replacement: ResearchExpression;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Applies an already classified research operation to a Dataset copy.
 * It does not classify edits, allocate identities, or retarget references.
 */
export function applyPreclassifiedP1LifecycleOperation(
  dataset: Dataset,
  operation: LifecycleOperation,
): Dataset {
  const copy = structuredClone(dataset);
  const entity = copy.entities.find(({ id }) => id === operation.entityId);
  const extensions = entity?.extensions;
  const payload = isRecord(extensions) ? extensions[RESEARCH_P1_NAMES_EXTENSION_ID] : undefined;
  if (!entity || !isRecord(extensions) || !isRecord(payload) || !Array.isArray(payload.expressions)) {
    return copy;
  }

  const targetIndex = payload.expressions.findIndex(
    (expression) => isRecord(expression)
      && typeof expression.id === "string"
      && typeof expression.value === "string"
      && expression.id === operation.expressionId,
  );
  if (targetIndex < 0) return copy;

  const nextExpressions = operation.kind === "pre-classified-non-substantive"
    ? payload.expressions.map((expression, index) =>
      index === targetIndex ? { ...operation.replacement, id: operation.expressionId } : expression)
    : payload.expressions.map((expression, index) =>
      index === targetIndex ? operation.replacement : expression);

  entity.extensions = {
    ...extensions,
    [RESEARCH_P1_NAMES_EXTENSION_ID]: {
      ...payload,
      expressions: nextExpressions,
    },
  };
  return copy;
}
