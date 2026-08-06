import { useEffect, useRef, useState } from "react";
import type { Dataset } from "../models/Dataset";
import type {
  DatasetExportIssue,
  DatasetExportResult,
} from "../services/DatasetService";
import {
  compareEventsByHistoryDate,
  formatEventHistoryDate,
} from "../services/HistoryService";

type TimelineScreenProps = {
  dataset: Dataset;
  selectedEvent: string | null;
  onSelectEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onAddEvent: () => void;
  onExportDataset: () => DatasetExportResult;
  onBackToHome: () => void;
};

function formatExportIssue(issue: DatasetExportIssue): string {
  const location = issue.path === "" ? "the document" : issue.path;
  const relatedIds =
    "relatedIds" in issue && issue.relatedIds?.length
      ? ` (${issue.relatedIds.join(", ")})`
      : "";

  return `${issue.code} at ${location}${relatedIds}`;
}

export function TimelineScreen({
  dataset,
  selectedEvent,
  onSelectEvent,
  onEditEvent,
  onAddEvent,
  onExportDataset,
  onBackToHome,
}: TimelineScreenProps) {
  const selectedEventRef = useRef<HTMLLIElement>(null);
  const [exportIssues, setExportIssues] = useState<DatasetExportIssue[]>([]);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    selectedEventRef.current?.focus();
    selectedEventRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedEvent, dataset.events.length]);

  const timelineEvents = [...dataset.events].sort(compareEventsByHistoryDate);

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
    anchor.download = "e2r-dataset.e2r.json";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Timeline</h1>

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
          Export E2R JSON
        </button>
      </div>

      {downloadError && <p role="alert">{downloadError}</p>}

      {exportIssues.length > 0 && (
        <section aria-labelledby="export-errors-heading">
          <h2 id="export-errors-heading">Export failed</h2>
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
              className="timeline-card"
              style={{
                marginBottom: "0.75rem",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                backgroundColor: isSelected ? "#eef6ff" : "#fff",
                cursor: "pointer",
              }}
            >
              <div className="timeline-card__row">
                <div
                  style={{
                    width: "7rem",
                    flexShrink: 0,
                    fontWeight: "bold",
                  }}
                >
                  {formatEventHistoryDate(event) ?? "----/--/--"}
                </div>

                <div className="timeline-event-content">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>{event.name ?? "(Unnamed Event)"}</strong>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event.id);
                        }}
                      >
                        Edit
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1rem",
        }}
      >
        <button onClick={onBackToHome}>Home</button>

        <button onClick={onAddEvent}>Add Event</button>
      </div>
    </main>
  );
}
