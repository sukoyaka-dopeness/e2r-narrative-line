import type { Dataset } from "../models/Dataset";

const STORAGE_KEY = "narrativeline.acceptedHandoffRecognition.v1";

export function getHandoffRecognitionStorage(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

type Recognition = {
  version: 1;
  datasetUrl: string;
  acceptedDatasetJson: string;
  savedDatasetJson: string;
};

function read(storage: Storage): Recognition | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<Recognition>;
    return candidate.version === 1 &&
      typeof candidate.datasetUrl === "string" &&
      typeof candidate.acceptedDatasetJson === "string" &&
      typeof candidate.savedDatasetJson === "string"
      ? candidate as Recognition : null;
  } catch {
    return null;
  }
}

export function isAcceptedHandoffReload({
  storage,
  datasetUrl,
  fetchedDataset,
  savedDatasetJson,
}: {
  storage: Storage;
  datasetUrl: string;
  fetchedDataset: Dataset;
  savedDatasetJson: string | null;
}): boolean {
  const recognition = read(storage);
  return Boolean(
    savedDatasetJson && recognition &&
    recognition.datasetUrl === datasetUrl &&
    recognition.acceptedDatasetJson === JSON.stringify(fetchedDataset) &&
    recognition.savedDatasetJson === savedDatasetJson,
  );
}

export function rememberAcceptedHandoff(
  storage: Storage,
  datasetUrl: string,
  acceptedDatasetJson: string,
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      datasetUrl,
      acceptedDatasetJson,
      savedDatasetJson: acceptedDatasetJson,
    } satisfies Recognition));
  } catch {
    // A failed recognition cache only restores the existing guarded prompt.
  }
}

export function rememberSavedHandoffDataset(storage: Storage, savedDatasetJson: string): void {
  const recognition = read(storage);
  if (!recognition) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...recognition, savedDatasetJson }));
  } catch {
    try { storage.removeItem(STORAGE_KEY); } catch { /* fail closed on reload */ }
  }
}

export function forgetAcceptedHandoff(storage: Storage): void {
  try { storage.removeItem(STORAGE_KEY); } catch { /* stale data must still match all fields */ }
}
