import { ModalDialog } from "./ModalDialog";

type Props = {
  datasetModified: boolean;
  pendingUserWork: boolean;
  busy: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onExportAndContinue: () => void;
  onExportDataset: () => void;
};

export function DatasetReplacementDialog({
  datasetModified,
  pendingUserWork,
  busy,
  onCancel,
  onDiscard,
  onExportAndContinue,
  onExportDataset,
}: Props) {
  const pendingOnly = pendingUserWork && !datasetModified;
  const modifiedAndPending = datasetModified && pendingUserWork;

  return (
    <ModalDialog
      ariaLabelledby="dataset-replacement-title"
      onDismiss={onCancel}
      onBackdropDismiss={onCancel}
      className="dataset-replacement-dialog"
    >
      <h2 id="dataset-replacement-title">
        {pendingOnly ? "Discard pending work?" : "Replace the current Dataset?"}
      </h2>
      <p>
        {modifiedAndPending
          ? "The current Dataset has changes and pending edits that are not all protected by export."
          : pendingOnly
            ? "Pending edits may not be included in an exported Dataset."
            : "The current Dataset has changes that have not been exported."}
      </p>
      <div className="modal-actions dataset-replacement-actions">
        <button type="button" className="replacement-cancel" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="button-danger" onClick={onDiscard} disabled={busy}>
          {modifiedAndPending ? "Discard work and Continue" : "Discard and Continue"}
        </button>
        {datasetModified && !pendingUserWork && (
          <button type="button" onClick={onExportAndContinue} disabled={busy}>
            Export and Continue
          </button>
        )}
        {modifiedAndPending && (
          <button type="button" onClick={onExportDataset} disabled={busy}>
            Export Dataset
          </button>
        )}
      </div>
    </ModalDialog>
  );
}
