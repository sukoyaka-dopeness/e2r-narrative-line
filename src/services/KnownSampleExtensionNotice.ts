import type { Dataset } from "../models/Dataset";
import type { DatasetImportWarning } from "./DatasetService";
import cedarEn from "../sample/cedar-observatory-showcase.en.e2r.json" with { type: "json" };
import cedarJa from "../sample/cedar-observatory-showcase.ja.e2r.json" with { type: "json" };

const extensionId = "draft.github.sukoyaka-dopeness.dimension-assessment";
const specificationId = "draft.github.sukoyaka-dopeness.specification";
const reviewedPayloads = [cedarEn, cedarJa].map((sample) =>
  JSON.stringify((sample.extensions as Record<string, unknown>)[extensionId]));

/** Informational recognition only. Validator 0.7.0 still owns the diagnostics. */
export function isKnownDimensionAssessmentNotice(dataset: Dataset, warnings: DatasetImportWarning[]): boolean {
  if (warnings.length !== 2) return false;
  const expected = new Map([
    ["unknown_extension", `/extensions/${extensionId}`],
    ["specification_unavailable", `/extensions/${specificationId}/uses/3/extension`],
  ]);
  if (!warnings.every(({ code, path, severity }) => severity === "warning" && expected.get(code) === path)
    || new Set(warnings.map(({ code }) => code)).size !== 2) return false;
  const extensions = dataset.extensions;
  const payload = extensions?.[extensionId];
  const specification = extensions?.[specificationId];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)
    || !specification || typeof specification !== "object" || Array.isArray(specification)) return false;
  const version = (payload as Record<string, unknown>).specVersion;
  const dimensions = (payload as Record<string, unknown>).dimensions;
  const assessments = (payload as Record<string, unknown>).assessments;
  const uses = (specification as Record<string, unknown>).uses;
  const declaration = Array.isArray(uses) ? uses.filter((item) => item && typeof item === "object"
    && (item as Record<string, unknown>).extension === extensionId) : [];
  return version === "0.2.0" && Array.isArray(dimensions) && Array.isArray(assessments)
    && (specification as Record<string, unknown>).specVersion === "0.1.0"
    && declaration.length === 1 && (declaration[0] as Record<string, unknown>).version === "0.2.0"
    && reviewedPayloads.includes(JSON.stringify(payload));
}
