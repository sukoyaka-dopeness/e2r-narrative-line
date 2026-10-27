import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type {
  DatasetImportIssue,
  DatasetImportResult,
} from "../services/DatasetService";
import { useLanguage } from "../i18n/LanguageContext";
import { getPresentationMessages } from "../i18n/messages";
import type { PeerWorkspaceStatus } from "../services/CrossTabWorkspaceService";
import { ImportFailureNotice } from "../components/ImportFailureNotice";

const SAMPLE_PROVENANCE_URL = "https://github.com/sukoyaka-dopeness/e2r-spec/blob/main/docs/public-samples/public-sample-provenance.md";
const GITHUB_SPONSORS_URL = "https://github.com/sponsors/sukoyaka-dopeness";
const KO_FI_URL = "https://ko-fi.com/sukoyaka_dopeness";

type Props = {
  onOpenTimeline: () => void;
  onOpenShowcase: () => void;
  onCreateDataset?: () => void;
  onImportDataset: (source: string) => DatasetImportResult;
  onResumeDataset?: () => void;
  hasResumeDataset?: boolean;
  handoffLoading?: boolean;
  handoffFailure?: string | null;
  peerWorkspaceStatus?: PeerWorkspaceStatus | null;
  suppressPeerWorkNotice?: boolean;
  replacementFeedback?: ReactNode;
};

export function HomeScreen({
  onOpenTimeline,
  onOpenShowcase,
  onCreateDataset,
  onImportDataset,
  onResumeDataset,
  hasResumeDataset = false,
  handoffLoading = false,
  handoffFailure = null,
  peerWorkspaceStatus = null,
  suppressPeerWorkNotice = false,
  replacementFeedback,
}: Props) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const copy = getPresentationMessages(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importIssues, setImportIssues] = useState<DatasetImportIssue[]>([]);
  const [fileReadError, setFileReadError] = useState(false);
  const peerWorkNotice = peerWorkspaceStatus?.kind === "work"
    ? (ja
      ? "別のNarrativeLineタブに未保存の作業があります。Datasetの置換はその作業を失うおそれがあるため、現在は安全に行えません。元のタブで編集を適用または取り消してください。Datasetを変更した場合は、必要に応じてExportしてから再試行してください。"
      : "Another NarrativeLine tab has unsaved work. Replacing a Dataset could lose that work, so it cannot be done safely yet. Apply or cancel the work in its original tab. If that changed the Dataset, export it if needed before retrying.")
    : peerWorkspaceStatus?.kind === "unknown"
      ? (ja
        ? "他のNarrativeLineタブの作業状態を安全に確認できませんでした。未保存作業があるとは断定できませんが、Datasetの置換前には安全確認が引き続き行われます。確認できる状態に戻してから再試行してください。"
        : "The work state of other NarrativeLine tabs could not be checked safely. This does not confirm that unsaved work exists; the replacement safety check will still run before any Dataset is replaced. Restore coordination and retry.")
      : null;

  const handleImportFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsImporting(true);
    setImportIssues([]);
    setFileReadError(false);

    try {
      const result = onImportDataset(await file.text());

      if (!result.isValid) {
        setImportIssues(result.issues);
      }
    } catch {
      setFileReadError(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className="home-screen">
      <div className="home-screen-content">
<h1>{ja ? "はじめる" : "Get Started"}</h1>
      <p className="home-description">{ja ? "できごとを並べて年表を作ります。" : "Create and edit E2R timelines centered on Events."}</p>

      {peerWorkNotice && !suppressPeerWorkNotice && <section className={`cross-tab-work-warning${peerWorkspaceStatus?.kind === "unknown" ? " is-uncertain" : ""}`} role="status" aria-live="polite">{peerWorkNotice}</section>}
      {handoffLoading && <p role="status">{copy.handoffLoading}</p>}
      {handoffFailure && <p role="alert">{handoffFailure}</p>}
      {replacementFeedback}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json,.e2r.json"
        onChange={handleImportFile}
        style={{ display: "none" }}
      />

      <div className="home-actions" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
        {hasResumeDataset && (
          <button type="button" onClick={onResumeDataset} disabled={handoffLoading} style={{ width: "100%" }}>
            {ja ? "編集を続ける" : "Continue Editing"}
          </button>
        )}
        <button
          type="button"
          onClick={onCreateDataset}
          disabled={!onCreateDataset || handoffLoading}
          style={{ width: "100%" }}
        >
          {ja ? "新しいDataset" : "New Dataset"}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting || handoffLoading}
          style={{ width: "100%" }}
        >
          {isImporting ? (ja ? "開いています…" : "Opening…") : (ja ? "E2R Datasetを開く" : "Open E2R Dataset")}
        </button>

        <div style={{ marginTop: "0.75rem" }}>
          <button type="button" onClick={onOpenTimeline} disabled={handoffLoading} style={{ width: "100%" }}>
           {ja ? "ベルリンの壁の例を開く" : "Open Berlin Wall example"}
          </button>
          <button type="button" onClick={onOpenShowcase} disabled={handoffLoading} style={{ width: "100%", marginTop: "0.5rem" }}>
            {ja ? "シダー天文台の例を開く" : "Open Cedar Observatory example"}
          </button>
          <a className="sample-info-link" href={SAMPLE_PROVENANCE_URL} target="_blank" rel="noreferrer">
            {copy.sampleInfo}
          </a>
        </div>
      </div>

      <a
        className="home-guide-link"
        href={ja
          ? "https://github.com/sukoyaka-dopeness/e2r-narrative-line/blob/main/docs/user-guide-ja.md"
          : "https://github.com/sukoyaka-dopeness/e2r-narrative-line/blob/main/docs/user-guide-en.md"}
        target="_blank"
        rel="noreferrer"
      >
        {ja ? "日本語ユーザーガイド" : "English user guide"}
      </a>

      <div className="home-support-links">
        <a className="support-link" href={GITHUB_SPONSORS_URL} target="_blank" rel="noreferrer">
          {copy.supportE2r}
        </a>
        <a className="support-link support-link--ko-fi" href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
          {copy.supportE2rOnKofi}
        </a>
      </div>

      {fileReadError && <p role="alert">{copy.localFileReadFailure}</p>}

      <ImportFailureNotice issues={importIssues} locale={language} headingId="import-errors-heading" hasCurrentDataset={false} />
      </div>
    </main>
  );
}
