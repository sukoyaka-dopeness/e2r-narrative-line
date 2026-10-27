import { useEffect, useRef } from "react";
import { ModalDialog } from "./ModalDialog";
import { getDatasetReplacementCopy } from "../services/DatasetReplacementCopyService";
import { useLanguage } from "../i18n/LanguageContext";
import { getImportWarningExplanation, ImportWarningDetails, SampleExtensionNotice } from "./ImportWarningPresentation";
import type { DatasetImportWarning } from "../services/DatasetService";
import type { Dataset } from "../models/Dataset";
import { isKnownDimensionAssessmentNotice } from "../services/KnownSampleExtensionNotice";

export function CandidateImportWarnings({ warnings, dataset }: { warnings: DatasetImportWarning[]; dataset: Dataset }) {
  const { language } = useLanguage();
  if (warnings.length === 0) return null;
  const known = isKnownDimensionAssessmentNotice(dataset, warnings);
  return (
    <section className={`replacement-candidate-warnings${known ? " replacement-candidate-warnings--compact" : ""}`} aria-label={known ? (language === "ja" ? "置き換え候補の追加情報" : "Additional information for the replacement candidate") : (language === "ja" ? "置き換え候補の読み込み警告" : "Import warnings for the replacement candidate")}>
      <h3>{known
        ? language === "ja" ? "置き換え候補の追加情報" : "Additional information for the replacement candidate"
        : language === "ja" ? `置き換え候補の読み込み警告（${warnings.length}件）` : `Import warnings for the replacement candidate (${warnings.length})`}</h3>
      <p>{language === "ja" ? "この情報は現在のDatasetではなく、置き換え候補に属します。" : "This information belongs to the replacement candidate, not the current Dataset."}</p>
      {known
        ? <SampleExtensionNotice dataset={dataset} warnings={warnings} locale={language} scope="candidate" />
        : <><p>{getImportWarningExplanation(warnings, language, "candidate")}</p><ImportWarningDetails warnings={warnings} locale={language} /></>}
    </section>
  );
}

type Props = {
  datasetModified: boolean;
  pendingUserWork: boolean;
  restoredDatasetHandoff?: boolean;
  candidateWarnings: DatasetImportWarning[];
  candidateDataset: Dataset;
  error?: string | null;
  busy: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onExportAndContinue: () => void;
  onExportDataset: () => void;
};

export function DatasetReplacementDialog({
  datasetModified,
  pendingUserWork,
  restoredDatasetHandoff = false,
  candidateWarnings,
  candidateDataset,
  error,
  busy,
  onCancel,
  onDiscard,
  onExportAndContinue,
  onExportDataset,
}: Props) {
  const { language } = useLanguage();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflowY;
    const previousBodyOverflow = body.style.overflowY;
    root.style.overflowY = "hidden";
    body.style.overflowY = "hidden";
    return () => {
      root.style.overflowY = previousRootOverflow;
      body.style.overflowY = previousBodyOverflow;
    };
  }, []);
  const pendingOnly = pendingUserWork && !datasetModified;
  const modifiedAndPending = datasetModified && pendingUserWork;
  const copy = getDatasetReplacementCopy(
    language,
    modifiedAndPending
      ? "modified-and-pending"
      : pendingOnly
        ? "pending-only"
        : restoredDatasetHandoff && !datasetModified
          ? "restored-handoff"
        : "modified-only",
  );

  return (
    <ModalDialog
      ariaLabelledby="dataset-replacement-title"
      onDismiss={onCancel}
      onBackdropDismiss={onCancel}
      className="dataset-replacement-dialog"
      initialFocusRef={cancelButtonRef}
    >
      <h2 id="dataset-replacement-title">{copy.title}</h2>
      <p>{copy.body}</p>
      <CandidateImportWarnings warnings={candidateWarnings} dataset={candidateDataset} />
      {error && <p role="alert">{error}</p>}
      <div className="modal-actions dataset-replacement-actions">
        <button ref={cancelButtonRef} type="button" className="replacement-cancel" onClick={onCancel} disabled={busy}>
          {copy.cancel}
        </button>
        <button type="button" className="button-danger" onClick={onDiscard} disabled={busy}>
          {copy.discard}
        </button>
        {(datasetModified || restoredDatasetHandoff) && !pendingUserWork && (
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
