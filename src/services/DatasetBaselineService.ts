import type { Dataset } from "../models/Dataset";

/** Serialize Dataset content only; application and browser state is excluded. */
export function serializeDatasetBaseline(dataset: Dataset): string {
  const serialized = JSON.stringify(dataset);
  if (serialized === undefined) {
    throw new TypeError("Dataset cannot be serialized for baseline comparison");
  }
  return serialized;
}

export function isDatasetModified(
  dataset: Dataset,
  acceptedBaseline: string,
): boolean {
  return serializeDatasetBaseline(dataset) !== acceptedBaseline;
}
