import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { useTimelineCardDrag, type TimelineCardDrop } from "../components/useTimelineCardDrag";
import { RelativeTimeTimelineProjection } from "../components/RelativeTimeTimelineProjection";
import { RelativeTimeDiagnosticNotice } from "../components/RelativeTimeDiagnosticNotice";
import type { RelativeTimeEvidenceState } from "../services/RelativeTimeService.ts";
import {
  formatEventHistoryDate,
  formatEventTimelineDate,
  getEventHistoryTime,
  validateHistoryDate,
} from "../services/HistoryService";
import { getHistory2PositionEditorValues } from "../services/History2Service";
import { getQuantitativeTimeCandidates } from "../services/QuantitativeTimeCandidateService.ts";
import { formatQuantitativeCandidateForDisplay, quantitativeRelationLabel, quantitativeRelationMovement } from "../services/QuantitativeTimePresentationService.ts";
import {
  getPerspectiveTimeline,
  type PerspectiveMoveResult,
} from "../services/PerspectiveOrderingService.ts";
import {
  formatEventIdentityLabel,
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
  onMoveEvent: (eventId: string, direction: "earlier" | "later") => PerspectiveMoveResult;
  onDropEvent: (eventId: string, targetEventId: string, position: "before" | "after") => PerspectiveMoveResult;
  onImportDataset: (source: string) => DatasetImportResult;
  onExportDataset: () => DatasetExportResult;
  importWarnings?: DatasetImportWarning[];
  onUpdateDatasetTitle: (title: string) => void;
  relativeTimeState: RelativeTimeEvidenceState;
  relativeTimeManuallyEnabled: boolean;
  onEnableRelativeTime: () => void;
  displayOrderEditingEnabled: boolean;
  onToggleDisplayOrderEditing: () => void;
  onEnableDisplayOrderEditing: () => void;
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
  dataset: Dataset,
  event: Dataset["events"][number],
  ja: boolean,
  includeSeconds: boolean,
): string | undefined {
  const time = getEventHistoryTime(event) ?? getHistory2PositionEditorValues(dataset, event)?.date;
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

function formatTimelineApproximateValue(value: string, ja: boolean): string {
  return ja ? `${value}頃` : `circa ${value}`;
}

export function TimelineScreen({
  dataset,
  datasetModified,
  selectedEvent,
  onSelectEvent,
  onEditEvent,
  onAddEvent,
  onMoveEvent,
  onDropEvent,
  onImportDataset,
  onExportDataset,
  importWarnings = [],
  onUpdateDatasetTitle,
  relativeTimeState,
  relativeTimeManuallyEnabled,
  onEnableRelativeTime,
  displayOrderEditingEnabled,
  onToggleDisplayOrderEditing,
  onEnableDisplayOrderEditing,
}: TimelineScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const copy = getPresentationMessages(language);
  const selectedEventRef = useRef<HTMLLIElement>(null);
  const timelineCardRefs = useRef(new Map<string, HTMLLIElement>());
  const pendingOrderPositions = useRef<Map<string, DOMRect> | null>(null);
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
  const [moveFeedback, setMoveFeedback] = useState<{
    dataset: Dataset;
    direction?: "earlier" | "later";
    eventName?: string;
    error: boolean;
  }>();
  const orderingButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingMoveFocus = useRef<{
    eventId: string;
    direction: "earlier" | "later";
  } | null>(null);
  const pendingDragFocus = useRef<string | null>(null);
  const quantitativeCandidatesByEvent = useMemo(() => new Map(
    relativeTimeState === "off" ? [] : dataset.events.map((event) =>
      [event.id, getQuantitativeTimeCandidates(dataset, event.id)] as const),
  ), [dataset, relativeTimeState]);

  useLayoutEffect(() => {
    const dragFocus = pendingDragFocus.current;
    if (dragFocus) {
      timelineCardRefs.current.get(dragFocus)?.focus();
      timelineCardRefs.current.get(dragFocus)?.scrollIntoView({ block: "nearest" });
      pendingDragFocus.current = null;
    }
    const pending = pendingMoveFocus.current;
    if (pending) {
      const buttonKey = (direction: "earlier" | "later") => `${pending.eventId}:${direction}`;
      const preferred = orderingButtonRefs.current.get(buttonKey(pending.direction));
      const alternate = orderingButtonRefs.current.get(
        buttonKey(pending.direction === "earlier" ? "later" : "earlier"),
      );
      const target = preferred && !preferred.disabled ? preferred : alternate;
      target?.focus();
      pendingMoveFocus.current = null;
    }

    const before = pendingOrderPositions.current;
    pendingOrderPositions.current = null;
    if (!before || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const moved: HTMLLIElement[] = [];
    for (const [eventId, node] of timelineCardRefs.current) {
      const previous = before.get(eventId);
      if (!previous || !node.isConnected) continue;
      const current = node.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (deltaX === 0 && deltaY === 0) continue;
      node.style.transition = "none";
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      moved.push(node);
    }

    if (moved.length === 0) return;
    void document.body.offsetHeight;
    window.requestAnimationFrame(() => {
      for (const node of moved) {
        node.style.transition = "";
        node.style.transform = "";
      }
    });
  }, [dataset]);

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
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    window.scrollTo({ top: 0, left: 0, behavior });
  };

  const handleBackToBottom = () => {
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    document.getElementById("timeline-footer")?.scrollIntoView({
      block: "end",
      behavior,
    });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      selectedEventRef.current?.focus();
      selectedEventRef.current?.scrollIntoView({ block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedEvent, dataset.events.length]);

  const perspectiveTimeline = getPerspectiveTimeline(dataset);
  const timelineEvents = perspectiveTimeline.events;
  const eventIdentity = resolveEventIdentityPresentations(timelineEvents, {
    getPrimary: (event) => event.name ?? copy.unnamedEvent,
    getChronology: getEventIdentityChronology,
  });
  const eventNames = new Map(dataset.events.map((event) => {
    const identity = eventIdentity.get(event.id);
    const name = identity?.primary ?? event.name ?? copy.unnamedEvent;
    return [event.id, identity?.shortIdHint ? `${name} (${identity.shortIdHint})` : name] as const;
  }));
  const formatPerspectiveDiagnostic = (
    diagnostic: (typeof perspectiveTimeline.diagnostics)[number],
  ): string => {
    if (diagnostic.kind === "dangling") {
      return copy.timelineDanglingPerspective.replace("{id}", diagnostic.eventIds[0] ?? "");
    }
    const names = diagnostic.eventIds.map((id) => eventNames.get(id) ?? id).join(" → ");
    return (diagnostic.kind === "history"
      ? copy.timelineHistoryMismatch
      : copy.timelineDerivedMismatch
    ).replace("{events}", names);
  };
  const diagnosticCountMessage = perspectiveTimeline.diagnostics.length === 1
    ? copy.timelineDiagnosticCountOne
    : copy.timelineDiagnosticCountMany.replace("{count}", String(perspectiveTimeline.diagnostics.length));
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

  const handleMove = (eventId: string, direction: "earlier" | "later") => {
    const before = new Map(
      [...timelineCardRefs.current].map(([id, node]) => [id, node.getBoundingClientRect()] as const),
    );
    pendingMoveFocus.current = { eventId, direction };
    const result = onMoveEvent(eventId, direction);
    const eventName = eventNames.get(eventId) ?? eventId;
    if (result.ok) {
      pendingOrderPositions.current = before;
      setMoveFeedback({
        dataset: result.dataset,
        direction,
        eventName,
        error: false,
      });
    } else {
      pendingMoveFocus.current = null;
      setMoveFeedback({
        dataset,
        error: true,
      });
    }
  };

  const handleDrop = ({ sourceId, targetId, position }: TimelineCardDrop) => {
    const before = new Map(
      [...timelineCardRefs.current].map(([id, node]) => [id, node.getBoundingClientRect()] as const),
    );
    const sourceIndex = timelineEvents.findIndex((event) => event.id === sourceId);
    const result = onDropEvent(sourceId, targetId, position);
    if (!result.ok) {
      setMoveFeedback({ dataset, error: true });
      return;
    }
    onSelectEvent(sourceId);
    if (result.dataset === dataset) {
      timelineCardRefs.current.get(sourceId)?.focus();
      return;
    }
    pendingDragFocus.current = sourceId;
    pendingOrderPositions.current = before;
    const nextIndex = getPerspectiveTimeline(result.dataset).events.findIndex((event) => event.id === sourceId);
    setMoveFeedback({
      dataset: result.dataset,
      direction: nextIndex < sourceIndex ? "earlier" : "later",
      eventName: eventNames.get(sourceId) ?? sourceId,
      error: false,
    });
  };
  const cardDrag = useTimelineCardDrag({
    enabled: displayOrderEditingEnabled && perspectiveTimeline.canAuthor,
    cardRefs: timelineCardRefs,
    onDrop: handleDrop,
  });

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
            relativeTimeLabel={
              relativeTimeState === "off" && !relativeTimeManuallyEnabled
                ? (ja ? "相対時間の機能を表示" : "Show Relative Time tools")
                : undefined
            }
            onShowRelativeTime={
              relativeTimeState === "off" && !relativeTimeManuallyEnabled
                ? onEnableRelativeTime
                : undefined
            }
            displayOrderLabel={perspectiveTimeline.canAuthor
              ? (displayOrderEditingEnabled
                ? copy.timelineStopEditingOrder
                : copy.timelineEditOrder)
              : undefined}
            onToggleDisplayOrder={perspectiveTimeline.canAuthor
              ? onToggleDisplayOrderEditing
              : undefined}
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

      <RelativeTimeDiagnosticNotice state={relativeTimeState} />

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

      {(relativeTimeState !== "off" || relativeTimeManuallyEnabled) && (
        <RelativeTimeTimelineProjection
          dataset={dataset}
          onEditEvent={onEditEvent}
          showWhenEmpty={relativeTimeState !== "off" || relativeTimeManuallyEnabled}
          diagnostic={relativeTimeState === "diagnostic"}
        />
      )}

      <h2 className="timeline-event-list-heading">
        {ja ? "タイムライン" : "Timeline"}
      </h2>
      {perspectiveTimeline.availability.kind === "multiple" && (
        <p role="status">
          {ja
            ? "複数のPerspectiveがあります。選択されていないため表示順の編集を停止し、すべてのPerspectiveを保持します。"
            : "Multiple Perspectives are present. Ordering edits are paused until one is explicitly selected; all are preserved."}
        </p>
      )}
      {perspectiveTimeline.availability.kind === "unsupported" && (
        <p role="status">
          {ja
            ? "このDatasetのPerspectiveまたはExtension宣言を安全に解釈できないため、表示順の編集を停止しています。元のデータは保持します。"
            : "This Dataset's Perspective or Extension declaration cannot be interpreted safely. Ordering edits are paused and the data is preserved."}
        </p>
      )}
      {perspectiveTimeline.availability.kind === "absent" && !perspectiveTimeline.canAuthor && (
        <p role="status">
          {ja
            ? "このDatasetでは使用中のExtensionすべての仕様バージョンを宣言できないため、Perspectiveの新規作成を停止しています。"
            : "Ordering is unavailable because this Dataset's used Extension versions cannot all be declared exactly."}
        </p>
      )}
      {moveFeedback?.dataset === dataset && (
        <p className="timeline-order-feedback" role={moveFeedback.error ? "alert" : "status"}>
          {moveFeedback.error
            ? copy.timelineMoveFailure
            : (moveFeedback.direction === "earlier" ? copy.timelineMoveEarlier : copy.timelineMoveLater)
              .replace("{event}", moveFeedback.eventName ?? "")}
        </p>
      )}
      {displayOrderEditingEnabled && perspectiveTimeline.canAuthor && (
        <p className="timeline-drag-hint">
          {ja ? "カードをドラッグして表示順を変更できます。↑/↓でも操作できます。" : "Drag a card to change display order, or use ↑/↓."}
        </p>
      )}
      {cardDrag.dragState && (
        <p className="timeline-drag-feedback" role="status">
          {cardDrag.dragState.targetId
            ? (ja
              ? `「${eventNames.get(cardDrag.dragState.sourceId)}」を「${eventNames.get(cardDrag.dragState.targetId)}」の${cardDrag.dragState.position === "before" ? "前" : "後"}へ移動`
              : `Move ${eventNames.get(cardDrag.dragState.sourceId)} ${cardDrag.dragState.position} ${eventNames.get(cardDrag.dragState.targetId)}`)
            : (ja ? "移動先のカードへドラッグしてください。" : "Drag to a destination card.")}
        </p>
      )}
      {perspectiveTimeline.diagnostics.length > 0 && (
        <section className="timeline-order-diagnostics" aria-label={ja ? "表示順の診断" : "Display order diagnostics"}>
          <p role="status">
            {diagnosticCountMessage}
          </p>
          <details>
            <summary>{copy.timelineDiagnosticDetails}</summary>
            <ul>
              {perspectiveTimeline.diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.kind}-${diagnostic.eventIds.join("-")}-${index}`}>
                  {formatPerspectiveDiagnostic(diagnostic)}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {timelineEvents.map((event, eventIndex) => {
          const isSelected = event.id === selectedEvent;
          const identity = eventIdentity.get(event.id);
          const history2Position = getHistory2PositionEditorValues(dataset, event);
          const isApproximate = history2Position?.approximation ?? false;
          const eventDiagnostics = perspectiveTimeline.diagnostics.filter(
            (diagnostic) => diagnostic.kind !== "dangling" && diagnostic.eventIds.includes(event.id),
          );
          const timelineDate = formatEventTimelineDate(dataset, event);
          const dateText = isApproximate
            ? timelineDate ?? "----/--/--"
            : formatEventHistoryDate(event) ?? timelineDate ?? "----/--/--";
          const timelineTime = formatTimelineEventTime(dataset, event, ja, isSelected);
          const dateDisplay = isApproximate && !timelineTime
            ? formatTimelineApproximateValue(dateText, ja)
            : dateText;
          const timeDisplay = isApproximate && timelineTime
            ? formatTimelineApproximateValue(timelineTime, ja)
            : timelineTime;
          const timeCandidates = quantitativeCandidatesByEvent.get(event.id) ?? [];

          return (
            <li
              key={event.id}
              ref={(node) => {
                if (node) timelineCardRefs.current.set(event.id, node);
                else timelineCardRefs.current.delete(event.id);
                if (isSelected) selectedEventRef.current = node;
              }}
              tabIndex={perspectiveTimeline.canAuthor ? 0 : -1}
              onPointerDown={(pointerEvent) => cardDrag.onPointerDown(event.id, pointerEvent)}
              onDragStart={(dragEvent) => {
                if (displayOrderEditingEnabled) dragEvent.preventDefault();
              }}
              onClick={(clickEvent) => {
                if (cardDrag.consumeClick()) {
                  clickEvent.preventDefault();
                  clickEvent.stopPropagation();
                  return;
                }
                onSelectEvent(event.id);
              }}
              onKeyDown={(keyEvent) => {
                if (keyEvent.target !== keyEvent.currentTarget) return;
                if (keyEvent.key !== "Enter" && keyEvent.key !== " ") return;
                keyEvent.preventDefault();
                onSelectEvent(event.id);
              }}
              className={`timeline-card${isSelected ? " timeline-card--selected" : ""}${displayOrderEditingEnabled && perspectiveTimeline.canAuthor ? " timeline-card--drag-enabled" : ""}${cardDrag.dragState?.sourceId === event.id ? " timeline-card--dragging" : ""}${cardDrag.dragState?.targetId === event.id ? ` timeline-card--drop-${cardDrag.dragState.position}` : ""}`}
            >
              <div className="timeline-card__row">
                <div
                  style={{
                    width: "var(--timeline-date-column-width)",
                    flexShrink: 0,
                    fontWeight: "bold",
                  }}
                >
                  <div
                    aria-label={isApproximate && !timelineTime ? dateDisplay : undefined}
                  >
                    {dateDisplay}
                  </div>
                  {timeDisplay && (
                    <small className="timeline-event-time">
                      {timeDisplay}
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
                        className="timeline-card__edit-action"
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

                  {timeCandidates.length > 0 && (
                    <div className="timeline-time-candidate">
                      <small>{ja ? `日時候補 ${timeCandidates.length} 件（未記録）` :
                        `${timeCandidates.length} date/time candidate${timeCandidates.length === 1 ? "" : "s"} (not recorded)`}</small>
                      {isSelected && <ul className="timeline-time-candidate__values">
                        {timeCandidates.map((candidate) => {
                          const date = formatQuantitativeCandidateForDisplay(candidate.date, language);
                          const anchorIdentity = eventIdentity.get(candidate.anchorEventId);
                          const anchor = anchorIdentity ? formatEventIdentityLabel(anchorIdentity) : candidate.anchorEventId;
                          const currentIsTarget = dataset.relations.find(({ id }) => id === candidate.relationId)?.targetId === event.id;
                          return <li key={candidate.relationId}>
                            <strong>{date.value}</strong>
                            {date.precision && <span>{date.precision}</span>}
                            <span>{ja ? `${anchor}との「${quantitativeRelationMovement(candidate.payload, currentIsTarget, language)}」の記録から算出` :
                              `Calculated from the “${quantitativeRelationLabel(candidate.payload, currentIsTarget, anchor, language)}” relation`}</span>
                          </li>;
                        })}
                      </ul>}
                      {isSelected && <small>{ja ? "未記録・タイムゾーン / サマータイム未考慮" : "Not recorded · Time Zone / DST not evaluated"}</small>}
                    </div>
                  )}

                  {isSelected && event.description && (
                    <div className="event-description-preview">
                      {event.description.split(/\r?\n/, 1)[0]}
                    </div>
                  )}
                </div>
              </div>
              {eventDiagnostics.length > 0 && (
                <details className="timeline-card__order-diagnostic">
                  <summary>{copy.timelineReviewDisplayOrder}</summary>
                  <ul>
                    {eventDiagnostics.map((diagnostic, index) => (
                      <li key={`${diagnostic.kind}-${diagnostic.eventIds.join("-")}-${index}`}>
                        {formatPerspectiveDiagnostic(diagnostic)}
                      </li>
                    ))}
                  </ul>
                  {perspectiveTimeline.canAuthor && !displayOrderEditingEnabled && (
                    <button
                      type="button"
                      className="timeline-diagnostic-edit-order"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onEnableDisplayOrderEditing();
                        timelineCardRefs.current.get(event.id)?.focus();
                      }}
                    >
                      {copy.timelineEditOrder}
                    </button>
                  )}
                </details>
              )}
              {perspectiveTimeline.canAuthor && displayOrderEditingEnabled && (
                <div className="timeline-order-actions">
                  <details className="timeline-order-actions__help">
                    <summary>{copy.timelineOrderHelp}</summary>
                    <p>{copy.timelineOrderSafety}</p>
                    <p>
                      {perspectiveTimeline.placedIds.has(event.id)
                        ? copy.timelinePlacedDescription
                        : copy.timelineUnplacedDescription}
                    </p>
                  </details>
                  <button
                    type="button"
                    ref={(node) => {
                      const key = `${event.id}:earlier`;
                      if (node) orderingButtonRefs.current.set(key, node);
                      else orderingButtonRefs.current.delete(key);
                    }}
                    disabled={eventIndex === 0}
                    aria-label={ja
                      ? `「${eventNames.get(event.id)}」を表示順で上へ移動。${perspectiveTimeline.placedIds.has(event.id) ? "表示順に配置済み" : "未配置、導出表示"}`
                      : `Move ${eventNames.get(event.id)} earlier in display order; ${perspectiveTimeline.placedIds.has(event.id) ? "placed" : "unplaced, using derived display"}`}
                    onClick={(e) => { e.stopPropagation(); handleMove(event.id, "earlier"); }}
                  >↑</button>
                  <button
                    type="button"
                    ref={(node) => {
                      const key = `${event.id}:later`;
                      if (node) orderingButtonRefs.current.set(key, node);
                      else orderingButtonRefs.current.delete(key);
                    }}
                    disabled={eventIndex === timelineEvents.length - 1}
                    aria-label={ja
                      ? `「${eventNames.get(event.id)}」を表示順で下へ移動。${perspectiveTimeline.placedIds.has(event.id) ? "表示順に配置済み" : "未配置、導出表示"}`
                      : `Move ${eventNames.get(event.id)} later in display order; ${perspectiveTimeline.placedIds.has(event.id) ? "placed" : "unplaced, using derived display"}`}
                    onClick={(e) => { e.stopPropagation(); handleMove(event.id, "later"); }}
                  >↓</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

    </main>
  );
}
