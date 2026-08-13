import type { Dataset } from "../models/Dataset";
import { createDatasetId } from "./IdentifierService.ts";
import {
  validateCoreDataset,
  type CoreDatasetValidationIssue,
} from "./ValidationService.ts";
import {
  migrateLegacyDataset,
  type LegacyDatasetMigrationIssue,
} from "./LegacyDatasetService.ts";
import { addExportSpecificationDeclaration } from "./SpecificationDeclarationService.ts";

export interface DatasetImportSyntaxIssue {
  code: "json_parse_error";
  path: "";
}

export interface DatasetImportMigrationNotice {
  code: "legacy_dataset_migrated";
  path: "";
  severity: "warning";
  profile: string;
}

export type DatasetImportIssue =
  | DatasetImportSyntaxIssue
  | DatasetImportMigrationNotice
  | LegacyDatasetMigrationIssue
  | CoreDatasetValidationIssue;

export type DatasetImportWarning =
  | DatasetImportMigrationNotice
  | (CoreDatasetValidationIssue & { severity: "warning" });

export interface DatasetImportMigration {
  profile: string;
  originalSource: string;
}

export interface DatasetImportResult {
  isValid: boolean;
  issues: DatasetImportIssue[];
  dataset?: Dataset;
  migration?: DatasetImportMigration;
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

export function updateDatasetTitle(dataset: Dataset, title: string): Dataset {
  const trimmedTitle = title.trim();
  const metadata = { ...(dataset.extensions?.metadata ?? {}) };

  if (trimmedTitle) {
    metadata.title = trimmedTitle;
  } else {
    delete metadata.title;
  }

  const extensions = { ...(dataset.extensions ?? {}) };
  if (Object.keys(metadata).length > 0) {
    extensions.metadata = metadata;
  } else {
    delete extensions.metadata;
  }

  return {
    ...dataset,
    ...(Object.keys(extensions).length > 0 ? { extensions } : { extensions: undefined }),
  };
}

export function getDatasetExportFilename(dataset: Dataset): string {
  const title = dataset.extensions?.metadata?.title?.trim();
  const safeTitle = title
    ?.replace(/[<>:"/\\|?*]/g, "-")
    .replace(/[. -]+$/g, "")
    .trim();

  return `${safeTitle || "e2r-dataset"}.e2r.json`;
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

  const legacy = migrateLegacyDataset(parsedValue);
  if (legacy.status === "invalid") {
    return {
      isValid: false,
      issues: [legacy.issue],
    };
  }

  const valueToValidate =
    legacy.status === "migrated" ? legacy.value : parsedValue;
  const validation = validateCoreDataset(valueToValidate);
  const migration =
    legacy.status === "migrated"
      ? { profile: legacy.profile, originalSource: source }
      : undefined;
  const migrationNotice: DatasetImportMigrationNotice[] = migration
    ? [
        {
          code: "legacy_dataset_migrated",
          path: "",
          severity: "warning",
          profile: migration.profile,
        },
      ]
    : [];

  return {
    isValid: validation.isValid,
    issues: [...migrationNotice, ...validation.issues],
    ...(validation.dataset === undefined ? {} : { dataset: validation.dataset }),
    ...(migration === undefined ? {} : { migration }),
  };
}

export function exportDatasetJson(dataset: Dataset): DatasetExportResult {
  const sourceValidation = validateCoreDataset(dataset);

  if (!sourceValidation.isValid) {
    return {
      isValid: false,
      issues: sourceValidation.issues,
    };
  }

  const prepared = addExportSpecificationDeclaration(dataset);
  const exportDataset = prepared.dataset;
  const exportValidation =
    prepared.status === "added"
      ? validateCoreDataset(exportDataset)
      : sourceValidation;

  if (!exportValidation.isValid) {
    return {
      isValid: false,
      issues: exportValidation.issues,
    };
  }

  try {
    const json = JSON.stringify(exportDataset, null, 2);

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
