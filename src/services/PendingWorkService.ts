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

export type BeforeUnloadEventTarget = {
  addEventListener: (
    type: "beforeunload",
    listener: (event: BeforeUnloadEvent) => void,
  ) => void;
  removeEventListener: (
    type: "beforeunload",
    listener: (event: BeforeUnloadEvent) => void,
  ) => void;
};

export function registerBeforeUnloadProtection(
  target: BeforeUnloadEventTarget,
  lossRisk: boolean,
): () => void {
  if (!lossRisk) return () => undefined;

  const preventDocumentExitLoss = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  };

  target.addEventListener("beforeunload", preventDocumentExitLoss);
  return () => target.removeEventListener("beforeunload", preventDocumentExitLoss);
}
