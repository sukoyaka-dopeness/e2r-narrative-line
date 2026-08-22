import { ModalDialog } from "./ModalDialog";
import { getDatasetReplacementCopy } from "../services/DatasetReplacementCopyService";
import { useLanguage } from "../i18n/LanguageContext";

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
  const { language } = useLanguage();
  const pendingOnly = pendingUserWork && !datasetModified;
  const modifiedAndPending = datasetModified && pendingUserWork;
  const copy = getDatasetReplacementCopy(
    language,
    modifiedAndPending
      ? "modified-and-pending"
      : pendingOnly
        ? "pending-only"
        : "modified-only",
  );

  return (
    <ModalDialog
      ariaLabelledby="dataset-replacement-title"
      onDismiss={onCancel}
      onBackdropDismiss={onCancel}
      className="dataset-replacement-dialog"
    >
      <h2 id="dataset-replacement-title">{copy.title}</h2>
      <p>{copy.body}</p>
      <div className="modal-actions dataset-replacement-actions">
        <button type="button" className="replacement-cancel" onClick={onCancel} disabled={busy}>
          {copy.cancel}
        </button>
        <button type="button" className="button-danger" onClick={onDiscard} disabled={busy}>
          {copy.discard}
        </button>
        {datasetModified && !pendingUserWork && (
          <button type="button" onClick={onExportAndContinue} disabled={busy}>
            {copy.exportAndContinue}
          </button>
        )}
        {modifiedAndPending && (
          <button type="button" onClick={onExportDataset} disabled={busy}>
            {copy.exportDataset}
          </button>
        )}
      </div>
    </ModalDialog>
  );
}
