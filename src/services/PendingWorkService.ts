export type PendingWorkSources = Record<string, boolean>;

export function hasPendingUserWork(sources: PendingWorkSources): boolean {
  return Object.values(sources).some(Boolean);
}

export function hasLossRisk(
  datasetModified: boolean,
  pendingUserWork: boolean,
): boolean {
  return datasetModified || pendingUserWork;
}
