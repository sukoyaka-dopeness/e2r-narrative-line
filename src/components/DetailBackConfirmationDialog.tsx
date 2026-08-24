import { useLanguage } from "../i18n/LanguageContext";
import {
  getDetailBackConfirmationCopy,
  type DetailDiscardCopyKind,
} from "../services/DetailDiscardCopyService";
import { ModalDialog } from "./ModalDialog";

type DetailBackConfirmationDialogProps = {
  kind: DetailDiscardCopyKind;
  onCancel: () => void;
  onDiscard: () => void;
};

export function DetailBackConfirmationDialog({
  kind,
  onCancel,
  onDiscard,
}: DetailBackConfirmationDialogProps) {
  const { language } = useLanguage();
  const copy = getDetailBackConfirmationCopy(language, kind);

  return (
    <ModalDialog
      ariaLabelledby="detail-back-confirmation-title"
      onDismiss={onCancel}
      onBackdropDismiss={onCancel}
    >
      <h2 id="detail-back-confirmation-title">{copy.title}</h2>
      <p>{copy.body}</p>
      <div className="modal-actions detail-back-confirmation-actions">
        <button type="button" onClick={onCancel}>
          {copy.cancel}
        </button>
        <button type="button" className="button-danger" onClick={onDiscard}>
          {copy.confirm}
        </button>
      </div>
    </ModalDialog>
  );
}
