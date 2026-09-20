import { useEffect, useRef, useState } from "react";
import type { Dataset } from "../models/Dataset";
import type {
  DatasetImportIssue,
  DatasetExportIssue,
  DatasetExportResult,
  DatasetImportResult,
  DatasetImportWarning,
} from "../services/DatasetService";
import { downloadDatasetExport } from "../services/DatasetService";
import { WorkspaceMoreMenu } from "../components/WorkspaceMoreMenu";
import {
  compareEventsByHistoryDate,
  formatEventHistoryDate,
  formatEventTimelineDate,
  getEventHistoryTime,
  validateHistoryDate,
} from "../services/HistoryService";
import { getHistory2PositionEditorValues } from "../services/History2Service";
import {
  getEventIdentityChronology,
  resolveEventIdentityPresentations,
} from "../services/EventIdentityPresentationService";
import { useLanguage } from "../i18n/LanguageContext";
import { formatEventCount, getPresentationMessages } from "../i18n/messages";

type TimelineScreenProps = {
  dataset: Dataset;
  datasetModified: boolean;
  selectedEvent: string | null;
  onSelectEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onAddEvent: () => void;
  onImportDataset: (source: string) => DatasetImportResult;
  onExportDataset: () => DatasetExportResult;
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

function formatImportIssue(issue: DatasetImportIssue): string {
  const location = issue.path === "" ? "the document" : issue.path;
  const relatedIds =
    "relatedIds" in issue && issue.relatedIds?.length
      ? ` (${issue.relatedIds.join(", ")})`
      : "";

  return `${issue.code} at ${location}${relatedIds}`;
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
  datasetModified,
  selectedEvent,
  onSelectEvent,
  onEditEvent,
  onAddEvent,
  onImportDataset,
  onExportDataset,
  importWarnings = [],
  onUpdateDatasetTitle,
}: TimelineScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const copy = getPresentationMessages(language);
  const selectedEventRef = useRef<HTMLLIElement>(null);
  const timelineTopSentinelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importIssues, setImportIssues] = useState<DatasetImportIssue[]>([]);
  const [fileReadError, setFileReadError] = useState(false);
  const [exportIssues, setExportIssues] = useState<DatasetExportIssue[]>([]);
  const [downloadError, setDownloadError] = useState(false);
  const [titleDraft, setTitleDraft] = useState(
    dataset.extensions?.metadata?.title ?? "",
  );
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showBackToBottom, setShowBackToBottom] = useState(true);

  useEffect(() => {
    const sentinel = timelineTopSentinelRef.current;
    const footer = document.getElementById("timeline-footer");

    if (!sentinel || !footer || typeof window.IntersectionObserver === "undefined") return;

    const observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === sentinel) setShowBackToTop(!entry.isIntersecting);
        if (entry.target === footer) setShowBackToBottom(!entry.isIntersecting);
      }
    });

    observer.observe(sentinel);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleBackToBottom = () => {
    document.getElementById("timeline-footer")?.scrollIntoView({
      block: "end",
      behavior: "auto",
    });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      selectedEventRef.current?.focus();
      selectedEventRef.current?.scrollIntoView({ block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedEvent, dataset.events.length]);

  const timelineEvents = [...dataset.events].sort((left, right) =>
    compareEventsByHistoryDate(left, right, dataset),
  );
  const eventIdentity = resolveEventIdentityPresentations(timelineEvents, {
    getPrimary: (event) => event.name ?? copy.unnamedEvent,
    getChronology: getEventIdentityChronology,
  });
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
      setDownloadError(result.issues.length === 0);
      return;
    }

    setExportIssues([]);
    setDownloadError(false);

    downloadDatasetExport(dataset, result);
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsImporting(true);
    setImportIssues([]);
    setFileReadError(false);

    try {
      const result = onImportDataset(await file.text());
      if (!result.isValid) setImportIssues(result.issues);
    } catch {
      setFileReadError(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main
      className="timeline-screen"
      data-dataset-modified={datasetModified ? "true" : "false"}
    >
      <div ref={timelineTopSentinelRef} aria-hidden="true" />
      <h1 id="timeline-heading" className="visually-hidden">
        {ja ? "タイムライン" : "Timeline"}
      </h1>

      <section className="dataset-identity" aria-labelledby="timeline-heading">
        <label className="dataset-title-editor__label" htmlFor="dataset-title-input">
          {copy.datasetTitleLabel}
        </label>
        <div className="dataset-title-editor">
          <input
            id="dataset-title-input"
            type="text"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            placeholder={ja ? "タイトルを入力してください" : "Enter dataset title"}
            aria-label={copy.datasetTitleLabel}
          />
          <button
            type="button"
            onClick={() => onUpdateDatasetTitle(titleDraft)}
            disabled={titleDraft === (dataset.extensions?.metadata?.title ?? "")}
          >
            {ja ? "タイトルを適用" : "Apply title"}
          </button>
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json,.e2r.json"
        onChange={handleImportFile}
        style={{ display: "none" }}
      />

      <div className="timeline-toolbar">
        <p>{formatEventCount(language, dataset.events.length)}</p>
        <div className="timeline-toolbar__actions">
          <button type="button" onClick={onAddEvent}>{ja ? "できごとを追加" : "Add Event"}</button>
          {showBackToTop && (
            <button
              type="button"
              className="timeline-navigation-action"
              aria-label={ja ? "上へ" : "Top"}
              onClick={handleBackToTop}
            >
              <span className="timeline-navigation-action__full" aria-hidden="true">
                {ja ? "↑ 上へ" : "↑ Top"}
              </span>
              <span className="timeline-navigation-action__compact" aria-hidden="true">↑</span>
            </button>
          )}
          {showBackToBottom && (
            <button
              type="button"
              className="timeline-navigation-action"
              aria-label={ja ? "下へ" : "Bottom"}
              onClick={handleBackToBottom}
            >
              <span className="timeline-navigation-action__full" aria-hidden="true">
                {ja ? "↓ 下へ" : "↓ Bottom"}
              </span>
              <span className="timeline-navigation-action__compact" aria-hidden="true">↓</span>
            </button>
          )}
          <WorkspaceMoreMenu
            label={copy.more}
            openDatasetLabel={copy.openDataset}
            exportDatasetLabel={copy.exportDataset}
            onOpenDataset={() => fileInputRef.current?.click()}
            onExportDataset={handleExport}
          />
        </div>
      </div>

      {isImporting && <p role="status">{ja ? "開いています…" : "Opening…"}</p>}
      {fileReadError && <p role="alert">{copy.localFileReadFailure}</p>}
      {importIssues.length > 0 && (
        <section aria-labelledby="timeline-import-errors-heading">
          <h2 id="timeline-import-errors-heading">{ja ? "読み込みに失敗しました" : "Import failed"}</h2>
          <ul>
            {importIssues.map((issue, index) => (
              <li key={`${issue.code}-${issue.path}-${index}`}>{formatImportIssue(issue)}</li>
            ))}
          </ul>
        </section>
      )}
      {downloadError && <p role="alert">{copy.exportFailure}</p>}

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
          const identity = eventIdentity.get(event.id);

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
                  <div
                    aria-label={
                      getHistory2PositionEditorValues(dataset, event)?.approximation
                        ? `${ja ? "頃" : "circa"} ${formatEventTimelineDate(dataset, event) ?? "----/--/--"}`
                        : undefined
                    }
                  >
                    {getHistory2PositionEditorValues(dataset, event)?.approximation
                      ? ja
                        ? `${formatEventTimelineDate(dataset, event) ?? "----/--/--"}頃`
                        : `circa ${formatEventTimelineDate(dataset, event) ?? "----/--/--"}`
                      : formatEventHistoryDate(event) ?? formatEventTimelineDate(dataset, event) ?? "----/--/--"}
                  </div>
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
                      {identity?.primary ?? event.name ?? copy.unnamedEvent}
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

                  {identity?.shortIdHint && (
                    <div>
                      <small className="timeline-event-identity-hint">
                        {identity.shortIdHint}
                      </small>
                    </div>
                  )}

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

    </main>
  );
}
