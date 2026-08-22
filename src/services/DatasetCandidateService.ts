import type { Dataset } from "../models/Dataset";

export type DatasetCandidateSource = "new" | "local" | "sample" | "handoff";

export interface DatasetCandidate {
  dataset: Dataset;
  source: DatasetCandidateSource;
}

export function stageDatasetCandidate(
  dataset: Dataset,
  source: DatasetCandidateSource,
): DatasetCandidate {
  return { dataset, source };
}

export function acceptDatasetCandidate(candidate: DatasetCandidate): Dataset {
  return candidate.dataset;
}

export function clearDatasetCandidate(): null {
  return null;
}
