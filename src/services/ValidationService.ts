import { validateDataset } from "@sukoyaka-dopeness/e2r-validator";
import type { Dataset } from "../models/Dataset";

export type CoreDatasetValidationCode = string;

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

export function validateCoreDataset(value: unknown): CoreDatasetValidationResult {
  const result = validateDataset(value);
  const issues = result.diagnostics
    .filter((item) => item.severity === "error")
    .map(({ code, path, relatedIds }) => ({
      code,
      path,
      ...(relatedIds ? { relatedIds } : {}),
    }));

  return {
    isValid: result.valid,
    issues,
    ...(result.valid ? { dataset: value as Dataset } : {}),
  };
}
