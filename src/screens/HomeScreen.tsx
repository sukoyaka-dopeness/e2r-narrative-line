import { useRef, useState, type ChangeEvent } from "react";
import type {
  DatasetImportIssue,
  DatasetImportResult,
} from "../services/DatasetService";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  onOpenTimeline: () => void;
  onCreateDataset?: () => void;
  onImportDataset: (source: string) => DatasetImportResult;
  onResumeDataset?: () => void;
  hasResumeDataset?: boolean;
};

function formatImportIssue(issue: DatasetImportIssue): string {
  const location = issue.path === "" ? "the document" : issue.path;
  const relatedIds =
    "relatedIds" in issue && issue.relatedIds?.length
      ? ` (${issue.relatedIds.join(", ")})`
      : "";

  return `${issue.code} at ${location}${relatedIds}`;
}

export function HomeScreen({
  onOpenTimeline,
  onCreateDataset,
  onImportDataset,
  onResumeDataset,
  hasResumeDataset = false,
}: Props) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importIssues, setImportIssues] = useState<DatasetImportIssue[]>([]);
  const [fileReadError, setFileReadError] = useState<string | null>(null);

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
    setFileReadError(null);

    try {
      const result = onImportDataset(await file.text());

      if (!result.isValid) {
        setImportIssues(result.issues);
      }
    } catch {
      setFileReadError("The selected file could not be read.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "1.5rem",
        width: "100%",
        maxWidth: "22rem",
        margin: "0 auto",
        padding: "1rem",
      }}
    >
      <h1>{ja ? "はじめる" : "Get Started"}</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json,.e2r.json"
        onChange={handleImportFile}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
        {hasResumeDataset && (
          <button type="button" onClick={onResumeDataset} style={{ width: "100%" }}>
            {ja ? "編集中のDatasetを開く" : "Open Editing Dataset"}
          </button>
        )}
        <button
          type="button"
          onClick={onCreateDataset}
          disabled={!onCreateDataset}
          style={{ width: "100%" }}
        >
          {ja ? "Datasetを新規作成" : "Create Dataset"}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          style={{ width: "100%" }}
        >
          {isImporting ? (ja ? "読み込み中…" : "Importing…") : (ja ? "E2R JSONを読み込む" : "Import E2R JSON")}
        </button>

        <div style={{ marginTop: "0.75rem" }}>
          <button type="button" onClick={onOpenTimeline} style={{ width: "100%" }}>
           {ja ? "サンプルDatasetを開く" : "Open Sample Dataset"}
          </button>
        </div>
      </div>

      <a
        href="https://github.com/sukoyaka-dopeness/e2r-narrative-line/blob/main/docs/user-guide-ja.md"
        target="_blank"
        rel="noreferrer"
      >
        {ja ? "日本語ユーザーガイド" : "Japanese user guide"}
      </a>

      {fileReadError && <p role="alert">{fileReadError}</p>}

      {importIssues.length > 0 && (
        <section aria-labelledby="import-errors-heading">
        <h2 id="import-errors-heading">{ja ? "読み込みに失敗しました" : "Import failed"}</h2>
          <ul>
            {importIssues.map((issue, index) => (
              <li key={`${issue.code}-${issue.path}-${index}`}>
                {formatImportIssue(issue)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
