import type { Dataset } from "../models/Dataset";
import { createDatasetId } from "./IdentifierService.ts";
import {
  validateCoreDataset,
  type CoreDatasetValidationIssue,
} from "./ValidationService.ts";

export interface DatasetImportSyntaxIssue {
  code: "json_parse_error";
  path: "";
}

export type DatasetImportIssue =
  | DatasetImportSyntaxIssue
  | CoreDatasetValidationIssue;

export interface DatasetImportResult {
  isValid: boolean;
  issues: DatasetImportIssue[];
  dataset?: Dataset;
}

export interface DatasetExportSerializationIssue {
  code: "json_serialize_error";
  path: "";
}

export type DatasetExportIssue =
  | DatasetExportSerializationIssue
  | CoreDatasetValidationIssue;

export interface DatasetExportResult {
  isValid: boolean;
  issues: DatasetExportIssue[];
  json?: string;
}

export function createDataset(): Dataset {
  return {
    version: "1.0",
    entities: [],
    events: [],
    relations: [],
    extensions: {
      metadata: {
        datasetId: createDatasetId(),
      },
    },
  };
}

export function importDatasetJson(source: string): DatasetImportResult {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(source);
  } catch {
    return {
      isValid: false,
      issues: [{ code: "json_parse_error", path: "" }],
    };
  }

  const validation = validateCoreDataset(parsedValue);

  return {
    isValid: validation.isValid,
    issues: validation.issues,
    ...(validation.dataset === undefined ? {} : { dataset: validation.dataset }),
  };
}

export function exportDatasetJson(dataset: Dataset): DatasetExportResult {
  const validation = validateCoreDataset(dataset);

  if (!validation.isValid) {
    return {
      isValid: false,
      issues: validation.issues,
    };
  }

  try {
    const json = JSON.stringify(dataset, null, 2);

    if (json === undefined) {
      return {
        isValid: false,
        issues: [{ code: "json_serialize_error", path: "" }],
      };
    }

    return {
      isValid: true,
      issues: [],
      json: `${json}\n`,
    };
  } catch {
    return {
      isValid: false,
      issues: [{ code: "json_serialize_error", path: "" }],
    };
  }
}
