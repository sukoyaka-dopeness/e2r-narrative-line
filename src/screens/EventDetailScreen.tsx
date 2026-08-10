import { useEffect, useState } from "react";
import { ModalDialog } from "../components/ModalDialog";
import type { Dataset } from "../models/Dataset";
import type { Entity } from "../models/Entity";
import { useLanguage } from "../i18n/LanguageContext";
import {
  getEventHistoryDate,
  validateHistoryDate,
  type HistoryDate,
  type HistoryDateValidationError,
} from "../services/HistoryService";

const historyDateValidationMessages: Record<
  HistoryDateValidationError,
  string
> = {
  year_must_be_integer: "Year must be an integer.",
  month_requires_year: "Month requires a year.",
  month_must_be_integer: "Month must be an integer.",
  month_out_of_range: "Month must be between 1 and 12.",
  day_requires_month: "Day requires a year and month.",
  day_must_be_integer: "Day must be an integer.",
  day_out_of_range: "Day is not valid for the selected year and month.",
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
    left?.day === right.day
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

export function EventDetailScreen({
  dataset,
  selectedEvent,
  focusedRelatedEntityId,
  onUpdateEvent,
  onDeleteEvent,
  onSelectEntity,
  onSaveAndOpenEntityPicker,
  onRemoveEventEntity,
  isDraft,
  onCancel,
}: EventDetailScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const event =
    dataset.events.find((event) => event.id === selectedEvent) ?? null;
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
  const storedHistoryDate = event ? getEventHistoryDate(event) : undefined;
  const [year, setYear] = useState(
    storedHistoryDate?.year === undefined
      ? ""
      : String(storedHistoryDate.year),
  );
  const [month, setMonth] = useState(
    storedHistoryDate?.month === undefined
      ? ""
      : String(storedHistoryDate.month),
  );
  const [day, setDay] = useState(
    storedHistoryDate?.day === undefined
      ? ""
      : String(storedHistoryDate.day),
  );
  const [name, setName] = useState(event?.name ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [selectedRelatedEntity, setSelectedRelatedEntity] = useState<string | null>(
    focusedRelatedEntityId,
  );
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [entityPendingRemoval, setEntityPendingRemoval] = useState<Entity | null>(
    null,
  );

  useEffect(() => {
    if (!focusedRelatedEntityId) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-related-entity-id="${focusedRelatedEntityId}"]`)
        ?.scrollIntoView({ block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusedRelatedEntityId]);

  if (!event) {
    return <p>{ja ? "Eventが見つかりません。" : "Event not found."}</p>;
  }

  const editedHistoryDate: HistoryDate = {
    ...(year.trim() === "" ? {} : { year: parseOptionalInteger(year) }),
    ...(month.trim() === "" ? {} : { month: parseOptionalInteger(month) }),
    ...(day.trim() === "" ? {} : { day: parseOptionalInteger(day) }),
  };
  const historyDateValidationError = validateHistoryDate(editedHistoryDate);
  const getChangedEventUpdates = () => ({
    ...(historyDatesEqual(storedHistoryDate, editedHistoryDate)
      ? {}
      : { historyDate: editedHistoryDate }),
    ...(name === (event.name ?? "") ? {} : { name }),
    ...(description === (event.description ?? "") ? {} : { description }),
  });

  const handleSave = () => {
    if (historyDateValidationError) {
      return;
    }

    onUpdateEvent(event.id, getChangedEventUpdates());

    onCancel(event.id, false);
  };

  const handleSaveAndAddEntity = () => {
    if (historyDateValidationError) {
      return;
    }

    onSaveAndOpenEntityPicker(event.id, getChangedEventUpdates());
  };
  return (
    <div className="detail-screen">
      <div className="detail-header">
        <h1>{ja ? "できごとの詳細" : "Event Detail"}</h1>
        <p>
          {event.name || "(Unnamed Event)"}
        </p>
      </div>

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
              onChange={(inputEvent) => setDay(inputEvent.target.value)}
            />
          </label>
        </div>

        {historyDateValidationError && (
          <p role="alert" style={{ color: "#b00020", marginBottom: 0 }}>
            {historyDateValidationMessages[historyDateValidationError]}
          </p>
        )}
      </div>

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
                    {entity.name ?? "(Unnamed Entity)"}
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

        <div style={{ marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={handleSaveAndAddEntity}
            disabled={historyDateValidationError !== null}
          >
            {ja ? "保存して関連エンティティを追加" : "Save and Add Related Entity"}
          </button>
        </div>
      </div>

      <br />
      <br />

      <div className="detail-primary-actions">
        <button
          type="button"
          onClick={() => onCancel(event.id, isDraft)}
        >
          {ja ? "タイムラインに戻る" : "Back to Timeline"}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={historyDateValidationError !== null}
        >
          {ja ? "できごとを保存" : "Save Event"}
        </button>

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
          <p>{ja ? `このできごとと${entityPendingRemoval.name ?? "（名前なしのエンティティ）"}の直接の関係をすべて解除します。エンティティ自体はデータセットに残ります。` : `This removes every direct Relation between this Event and ${entityPendingRemoval.name ?? "(Unnamed Entity)"}. The Entity itself will remain in the Dataset.`}</p>
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
