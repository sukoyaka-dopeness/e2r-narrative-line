import { useEffect, useRef, useState } from "react";
import { CoordinatePanel } from "../components/CoordinatePanel";
import { ModalDialog } from "../components/ModalDialog";
import type { Dataset } from "../models/Dataset";
import type { Entity } from "../models/Entity";
import { useLanguage } from "../i18n/LanguageContext";
import { getPresentationMessages } from "../i18n/messages";
import {
  getEventHistoryTime,
  validateHistoryDate,
  type HistoryDate,
  type HistoryDateValidationError,
} from "../services/HistoryService";
import {
  classifyHistoryCapability,
  isHistoryEditable,
} from "../services/HistoryCapabilityService.ts";
import { getEventHistoryDependencyValues } from "../services/EventDetailDraftService";
import { getDetailDiscardCopy, getExistingDetailNavigationCopy } from "../services/DetailDiscardCopyService";

type HistoryValidationMessageKey =
  | "historyYearMustBeInteger"
  | "historyMonthRequiresYear"
  | "historyMonthMustBeInteger"
  | "historyMonthOutOfRange"
  | "historyDayRequiresMonth"
  | "historyDayMustBeInteger"
  | "historyDayOutOfRange"
  | "historyHourRequiresDay"
  | "historyHourMustBeInteger"
  | "historyHourOutOfRange"
  | "historyMinuteMustBeInteger"
  | "historyMinuteOutOfRange"
  | "historySecondMustBeInteger"
  | "historySecondOutOfRange";

const historyDateValidationMessageKeys: Record<
  HistoryDateValidationError,
  HistoryValidationMessageKey
> = {
  year_must_be_integer: "historyYearMustBeInteger",
  month_requires_year: "historyMonthRequiresYear",
  month_must_be_integer: "historyMonthMustBeInteger",
  month_out_of_range: "historyMonthOutOfRange",
  day_requires_month: "historyDayRequiresMonth",
  day_must_be_integer: "historyDayMustBeInteger",
  day_out_of_range: "historyDayOutOfRange",
  hour_requires_day: "historyHourRequiresDay",
  hour_must_be_integer: "historyHourMustBeInteger",
  hour_out_of_range: "historyHourOutOfRange",
  minute_must_be_integer: "historyMinuteMustBeInteger",
  minute_out_of_range: "historyMinuteOutOfRange",
  second_must_be_integer: "historySecondMustBeInteger",
  second_out_of_range: "historySecondOutOfRange",
};

function parseOptionalInteger(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

function historyDatesEqual(
  left: HistoryDate | undefined,
  right: HistoryDate,
): boolean {
  return (
    left?.year === right.year &&
    left?.month === right.month &&
    left?.day === right.day &&
    left?.hour === right.hour &&
    left?.minute === right.minute &&
    left?.second === right.second
  );
}

type EventDetailScreenProps = {
  dataset: Dataset;
  selectedEvent: string | null;
  focusedRelatedEntityId: string | null;
  onUpdateEvent: (
    eventId: string,
    updates: {
      historyDate?: HistoryDate;
      name?: string;
      description?: string;
    },
  ) => void;
  onPendingWorkChange: (pending: boolean) => void;
  pendingDraft?: EventDetailDraft;
  onDraftChange: (eventId: string, draft: EventDetailDraft) => void;
  onClearDraft: (eventId: string) => void;
  isDraft: boolean;
  onCancel: (eventId: string, discardDraft: boolean) => void;
  onSelectEntity: (entityId: string) => void;
  onSaveAndOpenEntityPicker: (
    eventId: string,
    updates: {
      historyDate?: HistoryDate;
      name?: string;
      description?: string;
    },
  ) => void;
  onRemoveEventEntity: (eventId: string, entityId: string) => void;
  onDeleteEvent: (eventId: string) => void;
};

export type EventDetailDraft = {
  name: string;
  description: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

export function EventDetailScreen({
  dataset,
  selectedEvent,
  focusedRelatedEntityId,
  onUpdateEvent,
  onPendingWorkChange,
  pendingDraft,
  onDraftChange,
  onClearDraft,
  onDeleteEvent,
  onSelectEntity,
  onSaveAndOpenEntityPicker,
  onRemoveEventEntity,
  isDraft,
  onCancel,
}: EventDetailScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const copy = getPresentationMessages(language);
  const event =
    dataset.events.find((event) => event.id === selectedEvent) ?? null;
  const historyCapability = classifyHistoryCapability(dataset, event);
  const historyEditable = isHistoryEditable(historyCapability);
  const relatedEntityIds = new Set(
    dataset.relations.flatMap((relation) => {
      if (relation.sourceId === selectedEvent) {
        return [relation.targetId];
      }

      if (relation.targetId === selectedEvent) {
        return [relation.sourceId];
      }

      return [];
    }),
  );
  const relatedEntities: Entity[] = dataset.entities.filter((entity) =>
    relatedEntityIds.has(entity.id),
  );
  const storedHistoryTime = event ? getEventHistoryTime(event) : undefined;
  const storedHistoryFields = getEventHistoryDependencyValues(event);
  const [year, setYear] = useState(
    pendingDraft?.year ?? (storedHistoryTime?.year === undefined
      ? ""
      : String(storedHistoryTime.year)),
  );
  const [month, setMonth] = useState(
    pendingDraft?.month ?? (storedHistoryTime?.month === undefined
      ? ""
      : String(storedHistoryTime.month)),
  );
  const [day, setDay] = useState(
    pendingDraft?.day ?? (storedHistoryTime?.day === undefined
      ? ""
      : String(storedHistoryTime.day)),
  );
  const [hour, setHour] = useState(
    pendingDraft?.hour ?? (storedHistoryTime?.hour === undefined ? "" : String(storedHistoryTime.hour)),
  );
  const [minute, setMinute] = useState(
    pendingDraft?.minute ?? (storedHistoryTime?.minute === undefined ? "" : String(storedHistoryTime.minute)),
  );
  const [second, setSecond] = useState(
    pendingDraft?.second ?? (storedHistoryTime?.second === undefined ? "" : String(storedHistoryTime.second)),
  );
  const [isTimeOpen, setIsTimeOpen] = useState(
    storedHistoryTime?.hour !== undefined ||
      storedHistoryTime?.minute !== undefined ||
      storedHistoryTime?.second !== undefined,
  );
  const [name, setName] = useState(pendingDraft?.name ?? event?.name ?? "");
  const [description, setDescription] = useState(
    pendingDraft?.description ?? event?.description ?? "",
  );
  const [selectedRelatedEntity, setSelectedRelatedEntity] = useState<string | null>(
    focusedRelatedEntityId,
  );
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [entityPendingRemoval, setEntityPendingRemoval] = useState<Entity | null>(
    null,
  );
  const disposingDraftRef = useRef(false);
  const hasPendingEdits =
    event !== null &&
    (name !== (event.name ?? "") ||
      description !== (event.description ?? "") ||
      (historyEditable && (
        year !== String(storedHistoryFields.year ?? "") ||
        month !== String(storedHistoryFields.month ?? "") ||
        day !== String(storedHistoryFields.day ?? "") ||
        hour !== String(storedHistoryFields.hour ?? "") ||
        minute !== String(storedHistoryFields.minute ?? "") ||
        second !== String(storedHistoryFields.second ?? "")
      )));

  useEffect(() => {
    if (!focusedRelatedEntityId) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-related-entity-id="${focusedRelatedEntityId}"]`)
        ?.scrollIntoView({ block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusedRelatedEntityId]);

  useEffect(() => {
    if (!event) {
      onPendingWorkChange(false);
      return;
    }

    onPendingWorkChange(hasPendingEdits);
    if (event) {
      if (hasPendingEdits && !disposingDraftRef.current) {
        onDraftChange(event.id, {
          name,
          description,
          year,
          month,
          day,
          hour,
          minute,
          second,
        });
      } else {
        onClearDraft(event.id);
      }
    }
  }, [
    event,
    name,
    description,
    year,
    month,
    day,
    hour,
    minute,
    second,
    storedHistoryFields.year,
    storedHistoryFields.month,
    storedHistoryFields.day,
    storedHistoryFields.hour,
    storedHistoryFields.minute,
    storedHistoryFields.second,
    onPendingWorkChange,
    onDraftChange,
    onClearDraft,
    hasPendingEdits,
    historyEditable,
  ]);

  if (!event) {
    return <p>{ja ? "Eventが見つかりません。" : "Event not found."}</p>;
  }

  const editedHistoryDate: HistoryDate = {
    ...(year.trim() === "" ? {} : { year: parseOptionalInteger(year) }),
    ...(month.trim() === "" ? {} : { month: parseOptionalInteger(month) }),
    ...(day.trim() === "" ? {} : { day: parseOptionalInteger(day) }),
    ...(hour.trim() === "" ? {} : { hour: parseOptionalInteger(hour) }),
    ...(minute.trim() === "" ? {} : { minute: parseOptionalInteger(minute) }),
    ...(second.trim() === "" ? {} : { second: parseOptionalInteger(second) }),
  };
  const historyDateValidationError = historyEditable
    ? validateHistoryDate(editedHistoryDate)
    : null;
  const getChangedEventUpdates = () => ({
    ...(!historyEditable || historyDatesEqual(storedHistoryTime, editedHistoryDate)
      ? {}
      : { historyDate: editedHistoryDate }),
    ...(name === (event.name ?? "") ? {} : { name }),
    ...(description === (event.description ?? "") ? {} : { description }),
  });
  const handleSave = () => {
    if (historyDateValidationError) {
      return;
    }

    disposingDraftRef.current = true;
    onClearDraft(event.id);
    onUpdateEvent(event.id, getChangedEventUpdates());

    onCancel(event.id, false);
  };

  const handleSaveAndAddEntity = () => {
    if (historyDateValidationError) {
      return;
    }

    disposingDraftRef.current = true;
    onClearDraft(event.id);
    onSaveAndOpenEntityPicker(event.id, getChangedEventUpdates());
  };
  return (
    <div className="detail-screen detail-screen--event">
      <div className="detail-header">
        <h1>{ja ? "できごとの詳細" : "Event Detail"}</h1>
        <p>
          {event.name || copy.unnamedEvent}
        </p>
      </div>

      {historyEditable ? (
      <div>
        <label>{ja ? "グレゴリオ暦" : "Gregorian Calendar"}</label>
        <div className="date-fields">
          <label>
            {ja ? "年" : "Year"}
            <br />
            <input
              type="number"
              step="1"
              value={year}
              onChange={(inputEvent) => {
                const nextYear = inputEvent.target.value;
                setYear(nextYear);

                if (nextYear.trim() === "") {
                  setMonth("");
                  setDay("");
                  setHour("");
                  setMinute("");
                  setSecond("");
                }
              }}
            />
          </label>

          <label>
            {ja ? "月" : "Month"}
            <br />
            <input
              type="number"
              step="1"
              min="1"
              max="12"
              value={month}
              disabled={year.trim() === ""}
              onChange={(inputEvent) => {
                const nextMonth = inputEvent.target.value;
                setMonth(nextMonth);

                if (nextMonth.trim() === "") {
                  setDay("");
                  setHour("");
                  setMinute("");
                  setSecond("");
                }
              }}
            />
          </label>

          <label>
            {ja ? "日" : "Day"}
            <br />
            <input
              type="number"
              step="1"
              min="1"
              max="31"
              value={day}
              disabled={year.trim() === "" || month.trim() === ""}
              onChange={(inputEvent) => {
                const nextDay = inputEvent.target.value;
                setDay(nextDay);
                if (nextDay.trim() === "") {
                  setHour("");
                  setMinute("");
                  setSecond("");
                }
              }}
            />
          </label>
        </div>

        {historyDateValidationError && (
          <p role="alert" style={{ color: "#b00020", marginBottom: 0 }}>
            {copy[historyDateValidationMessageKeys[historyDateValidationError]]}
          </p>
        )}

        <details
          className="event-time-fields"
          open={isTimeOpen}
          onToggle={(toggleEvent) =>
            setIsTimeOpen((toggleEvent.currentTarget as HTMLDetailsElement).open)
          }
        >
          <summary>{ja ? "時刻を入力（任意）" : "Add time (optional)"}</summary>
          <div className="date-fields">
            <label>
              {ja ? "時" : "Hour"}
              <br />
              <input
                type="number"
                min="0"
                max="23"
                step="1"
                value={hour}
                disabled={day.trim() === ""}
                onChange={(inputEvent) => {
                  const nextHour = inputEvent.target.value;
                  setHour(nextHour);
                  if (nextHour.trim() === "") {
                    setMinute("");
                    setSecond("");
                  }
                }}
              />
            </label>
            <label>
              {ja ? "分" : "Minute"}
              <br />
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                value={minute}
                disabled={hour.trim() === ""}
                onChange={(inputEvent) => {
                  const nextMinute = inputEvent.target.value;
                  setMinute(nextMinute);
                  if (nextMinute.trim() === "") setSecond("");
                }}
              />
            </label>
            <label>
              {ja ? "秒" : "Second"}
              <br />
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                value={second}
                disabled={minute.trim() === ""}
                onChange={(inputEvent) => setSecond(inputEvent.target.value)}
              />
            </label>
          </div>
        </details>
      </div>
      ) : (
        <p role="status" className="history-read-only-notice">
          {copy.historyReadOnlyNotice}
        </p>
      )}

      <br />

      <div>
        <label>{ja ? "名前" : "Name"}</label>
        <br />
        <input
          type="text"
          value={name}
          placeholder={ja ? "できごとの名前を入力してください" : "Enter event name"}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <br />

      <div>
        <label>{ja ? "説明" : "Description"}</label>
        <br />
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <CoordinatePanel key={event.id} dataset={dataset} object={event} />

      <br />

      <div>
        <label>{ja ? "関連エンティティ" : "Related Entities"}</label>

        <div className="related-list">
          {relatedEntities.length === 0 ? (
            <p style={{ color: "#666", margin: 0 }}>{ja ? "関連するエンティティはありません。" : "No related entities."}</p>
          ) : (
            relatedEntities.map((entity) => (
              <div
                key={entity.id}
                data-related-entity-id={entity.id}
                onClick={() => setSelectedRelatedEntity(entity.id)}
                className={`related-card${
                  selectedRelatedEntity === entity.id
                    ? " related-card--selected"
                    : ""
                }`}
              >
                <div className="related-card__header">
                  <span className="related-card__name">
                    {entity.name ?? copy.unnamedEntity}
                  </span>

                  {selectedRelatedEntity === entity.id && (
                    <div className="related-card__actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntity(entity.id);
                        }}
                      >
                        {ja ? "エンティティを編集" : "Edit Entity"}
                      </button>
                      <button
                        type="button"
                        className="danger-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntityPendingRemoval(entity);
                        }}
                      >
                        {ja ? "関連付けを解除" : "Remove Association"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      <br />
      <br />

      <div className="detail-primary-actions">
        <div className="detail-primary-actions__primary">
          <button
            type="button"
            onClick={handleSave}
            disabled={historyDateValidationError !== null}
          >
            {ja ? "できごとを保存" : "Save Event"}
          </button>
          <button
            type="button"
            onClick={handleSaveAndAddEntity}
            disabled={historyDateValidationError !== null}
          >
            {ja ? "保存して関連エンティティを追加" : "Save and Add Related Entity"}
          </button>
        </div>
        <div className="detail-primary-actions__exit">
          <button
            type="button"
            className={isDraft || hasPendingEdits ? "danger-action" : undefined}
            onClick={() => {
              disposingDraftRef.current = true;
              onClearDraft(event.id);
              onCancel(event.id, isDraft);
            }}
          >
            {isDraft
              ? getDetailDiscardCopy(language, "event-draft")
              : getExistingDetailNavigationCopy(language, "event", hasPendingEdits)}
          </button>
        </div>
      </div>

      <div className="danger-zone">
        <button
          type="button"
          className="danger-action"
          onClick={() => setIsDeleteConfirmationOpen(true)}
        >
          {ja ? "できごとを削除" : "Delete Event"}
        </button>
      </div>

      {isDeleteConfirmationOpen && (
        <ModalDialog
          ariaLabelledby="delete-event-heading"
          onDismiss={() => setIsDeleteConfirmationOpen(false)}
        >
          <h2 id="delete-event-heading">{ja ? "できごとを削除しますか？" : "Delete Event?"}</h2>
          <p>{ja ? "このできごとと関連する関係を完全に削除します。保存していない編集も破棄されます。" : "This permanently removes the Event and its connected Relations. Unsaved edits will also be discarded."}</p>
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              {ja ? "できごとを残す" : "Keep Event"}
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={() => onDeleteEvent(event.id)}
            >
              {ja ? "できごとを削除" : "Delete Event"}
            </button>
          </div>
        </ModalDialog>
      )}

      {entityPendingRemoval && (
        <ModalDialog
          ariaLabelledby="remove-entity-heading"
          onDismiss={() => setEntityPendingRemoval(null)}
        >
          <h2 id="remove-entity-heading">{ja ? "エンティティの関連付けを解除しますか？" : "Remove Entity Association?"}</h2>
          <p>{ja ? `このできごとと${entityPendingRemoval.name ?? copy.unnamedEntity}の直接の関係をすべて解除します。エンティティ自体はデータセットに残ります。` : `This removes every direct Relation between this Event and ${entityPendingRemoval.name ?? copy.unnamedEntity}. The Entity itself will remain in the Dataset.`}</p>
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setEntityPendingRemoval(null)}
            >
              {ja ? "関連付けを残す" : "Keep Association"}
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={() => {
                onRemoveEventEntity(event.id, entityPendingRemoval.id);
                setSelectedRelatedEntity(null);
                setEntityPendingRemoval(null);
              }}
            >
              {ja ? "関連付けを解除" : "Remove Association"}
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
