import { useEffect, useRef, useState } from "react";
import type { Dataset } from "../models/Dataset";
import type {
  DatasetExportIssue,
  DatasetExportResult,
  DatasetImportWarning,
} from "../services/DatasetService";
import { getDatasetExportFilename } from "../services/DatasetService";
import {
  compareEventsByHistoryDate,
  formatEventHistoryDate,
  getEventHistoryTime,
  validateHistoryDate,
} from "../services/HistoryService";
import { useLanguage } from "../i18n/LanguageContext";

type TimelineScreenProps = {
  dataset: Dataset;
  selectedEvent: string | null;
  onSelectEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onAddEvent: () => void;
  onExportDataset: () => DatasetExportResult;
  onBackToHome: () => void;
  importWarnings?: DatasetImportWarning[];
  onUpdateDatasetTitle: (title: string) => void;
};

function formatExportIssue(issue: DatasetExportIssue): string {
  const location = issue.path === "" ? "the document" : issue.path;
  const relatedIds =
    "relatedIds" in issue && issue.relatedIds?.length
      ? ` (${issue.relatedIds.join(", ")})`
      : "";

  return `${issue.code} at ${location}${relatedIds}`;
}

function formatImportWarning(issue: DatasetImportWarning): string {
  const location = issue.path === "" ? "the document" : issue.path;
  const relatedIds =
    "relatedIds" in issue && issue.relatedIds?.length
      ? ` (${issue.relatedIds.join(", ")})`
      : "";
  const profile = "profile" in issue ? ` (${issue.profile})` : "";

  return `${issue.code}${profile} at ${location}${relatedIds}`;
}

function getExtensionId(path: string): string | undefined {
  const match = /\/extensions\/([^/]+)/.exec(path);
  return match?.[1].replaceAll("~1", "/").replaceAll("~0", "~");
}

function formatTimelineEventTime(
  event: Dataset["events"][number],
  ja: boolean,
  includeSeconds: boolean,
): string | undefined {
  const time = getEventHistoryTime(event);
  if (
    !time ||
    time.hour === undefined ||
    validateHistoryDate(time) !== null
  ) {
    return undefined;
  }

  const unit = ja ? ["時", "分", "秒"] : ["h", "m", "s"];
  const parts = [`${String(time.hour).padStart(2, "0")}${unit[0]}`];

  if (time.minute !== undefined) {
    parts.push(`${String(time.minute).padStart(2, "0")}${unit[1]}`);
  }

  if (includeSeconds && time.second !== undefined) {
    parts.push(`${String(time.second).padStart(2, "0")}${unit[2]}`);
  }

  return parts.join(ja ? "" : " ");
}

export function TimelineScreen({
  dataset,
  selectedEvent,
  onSelectEvent,
  onEditEvent,
  onAddEvent,
  onExportDataset,
  onBackToHome,
  importWarnings = [],
  onUpdateDatasetTitle,
}: TimelineScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const selectedEventRef = useRef<HTMLLIElement>(null);
  const [exportIssues, setExportIssues] = useState<DatasetExportIssue[]>([]);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState(
    dataset.extensions?.metadata?.title ?? "",
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      selectedEventRef.current?.focus();
      selectedEventRef.current?.scrollIntoView({ block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedEvent, dataset.events.length]);

  const timelineEvents = [...dataset.events].sort(compareEventsByHistoryDate);
  const migrationWarnings = importWarnings.filter(
    ({ code }) => code === "legacy_dataset_migrated",
  );
  const unspecifiedVersionWarnings = importWarnings.filter(
    ({ code }) => code === "extension_version_unspecified",
  );
  const otherImportWarnings = importWarnings.filter(
    ({ code }) =>
      code !== "legacy_dataset_migrated" &&
      code !== "extension_version_unspecified",
  );
  const unspecifiedExtensionIds = [
    ...new Set(
      unspecifiedVersionWarnings
        .map(({ path }) => getExtensionId(path))
        .filter((value): value is string => value !== undefined),
    ),
  ];

  const handleExport = () => {
    const result = onExportDataset();

    if (result.json === undefined) {
      setExportIssues(result.issues);
      setDownloadError(
        result.issues.length === 0 ? "The Dataset could not be exported." : null,
      );
      return;
    }

    setExportIssues([]);
    setDownloadError(null);

    const blob = new Blob([result.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getDatasetExportFilename(dataset);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <main className="timeline-screen">
      <h1>{ja ? "タイムライン" : "Timeline"}</h1>

      <div className="dataset-title-editor">
        <input
          type="text"
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          placeholder={ja ? "タイトルを入力してください" : "Enter dataset title"}
          aria-label="Dataset title"
        />
        <button
          type="button"
          onClick={() => onUpdateDatasetTitle(titleDraft)}
          disabled={titleDraft === (dataset.extensions?.metadata?.title ?? "")}
        >
          {ja ? "タイトルを適用" : "Apply title"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <p>{dataset.events.length} events</p>

        <button type="button" onClick={handleExport}>
          {ja ? "E2R JSONを書き出す" : "Export E2R JSON"}
        </button>
      </div>

      {downloadError && <p role="alert">{downloadError}</p>}

      {importWarnings.length > 0 && (
        <section
          className="import-information"
          aria-labelledby="import-information-heading"
        >
          <h2 id="import-information-heading">
            {ja ? "読み込み情報" : "Import information"}
          </h2>
          <ul>
            {migrationWarnings.length > 0 && (
              <li>
                {ja
                  ? "旧形式の日付を現在のHistory形式へ変換して読み込みました。元のファイルは変更されません。エクスポートする新しいファイルでは、日付が現在のHistory形式で保存され、使用中のExtensionをすべて正確に宣言できる場合はその仕様バージョンも記録されます。"
                  : "Legacy dates were converted to the current History representation during import. The source file is not changed. In a newly exported file, dates use the current History representation and exact specification versions are recorded when every used Extension can be declared completely."}
              </li>
            )}
            {unspecifiedVersionWarnings.length > 0 && (
              <li>
                {ja ? (
                  <>
                    {unspecifiedExtensionIds.length > 0 && (
                      <><code>{unspecifiedExtensionIds.join(", ")}</code> の</>
                    )}
                    Extension仕様バージョンが宣言されていません。旧Datasetでは正常な状態で、読み込みと編集を続けられますが、作成時の正確な仕様バージョンは断定できません。
                  </>
                ) : (
                  <>
                    The Extension specification version
                    {unspecifiedExtensionIds.length > 0 && (
                      <> for <code>{unspecifiedExtensionIds.join(", ")}</code></>
                    )}{" "}
                    is not declared. This is normal for a legacy Dataset and does not prevent reading or editing it, but the exact specification version used when it was created is unknown.
                  </>
                )}
              </li>
            )}
            {otherImportWarnings.map((issue, index) => (
              <li key={`${issue.code}-${issue.path}-${index}`}>
                {formatImportWarning(issue)}
              </li>
            ))}
          </ul>
          <details>
            <summary>{ja ? "診断詳細" : "Diagnostic details"}</summary>
            <ul>
              {importWarnings.map((issue, index) => (
                <li key={`${issue.code}-${issue.path}-${index}`}>
                  <code>{formatImportWarning(issue)}</code>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {exportIssues.length > 0 && (
        <section aria-labelledby="export-errors-heading">
          <h2 id="export-errors-heading">{ja ? "エクスポートに失敗しました" : "Export failed"}</h2>
          <ul>
            {exportIssues.map((issue, index) => (
              <li key={`${issue.code}-${issue.path}-${index}`}>
                {formatExportIssue(issue)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {timelineEvents.map((event) => {
          const isSelected = event.id === selectedEvent;

          return (
            <li
              key={event.id}
              ref={isSelected ? selectedEventRef : null}
              tabIndex={-1}
              onClick={() => onSelectEvent(event.id)}
              className={`timeline-card${isSelected ? " timeline-card--selected" : ""}`}
            >
              <div className="timeline-card__row">
                <div
                  style={{
                    width: "7rem",
                    flexShrink: 0,
                    fontWeight: "bold",
                  }}
                >
                  <div>{formatEventHistoryDate(event) ?? "----/--/--"}</div>
                  {formatTimelineEventTime(event, ja, isSelected) && (
                    <small className="timeline-event-time">
                      {formatTimelineEventTime(event, ja, isSelected)}
                    </small>
                  )}
                </div>

                <div className="timeline-event-content">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong className="timeline-event-name">
                      {event.name ?? "(Unnamed Event)"}
                    </strong>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event.id);
                        }}
                      >
                        {ja ? "編集" : "Edit"}
                      </button>
                    )}
                  </div>

                  {isSelected && event.description && (
                    <div className="event-description-preview">
                      {event.description.split(/\r?\n/, 1)[0]}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="timeline-actions">
        <button onClick={onBackToHome}>{ja ? "ホーム" : "Home"}</button>

        <button onClick={onAddEvent}>{ja ? "できごとを追加" : "Add Event"}</button>
      </div>
    </main>
  );
}
