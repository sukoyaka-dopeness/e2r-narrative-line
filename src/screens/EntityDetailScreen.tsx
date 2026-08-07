import { useState } from "react";
import { ModalDialog } from "../components/ModalDialog";
import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";

type EntityDetailScreenProps = {
  dataset: Dataset;
  selectedEntity: string | null;
  onUpdateEntity: (
    entityId: string,
    updates: { name?: string; description?: string },
  ) => void;
  onDeleteEntity: (entityId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onBackToTimeline: () => void;
};

export function EntityDetailScreen({
  dataset,
  selectedEntity,
  onUpdateEntity,
  onDeleteEntity,
  onSelectEvent,
  onBackToTimeline,
}: EntityDetailScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const entity =
    dataset.entities.find((entity) => entity.id === selectedEntity) ?? null;
  const [name, setName] = useState(entity?.name ?? "");
  const [description, setDescription] = useState(entity?.description ?? "");
  const [selectedRelatedEvent, setSelectedRelatedEvent] = useState<
    string | null
  >(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);

  if (!entity) {
    return <p>{ja ? "Entityが見つかりません。" : "Entity not found."}</p>;
  }

  const handleSave = () => {
    onUpdateEntity(entity.id, { name, description });
    onBackToTimeline();
  };

  const relatedEventIds = new Set(
    dataset.relations.flatMap((relation) => {
      if (relation.sourceId === entity.id) {
        return [relation.targetId];
      }

      if (relation.targetId === entity.id) {
        return [relation.sourceId];
      }

      return [];
    }),
  );
  const relatedEvents = dataset.events.filter((event) =>
    relatedEventIds.has(event.id),
  );

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <h1>{ja ? "エンティティの詳細" : "Entity Detail"}</h1>
        <p>
          {entity.name || "(Unnamed Entity)"}
        </p>
      </div>

      <div>
        <label>{ja ? "名前" : "Name"}</label>
        <br />
        <input
          type="text"
          value={name}
          placeholder={ja ? "人物・組織・場所などを入力してください" : "Enter a person, organization, place, or other entity"}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <br />

      <div>
        <label>{ja ? "説明" : "Description"}</label>
        <br />
        <textarea
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <br />

      <div>
        <label>{ja ? "関連するできごと" : "Related Events"}</label>

        <div className="related-list">
          {relatedEvents.length === 0 ? (
            <p style={{ color: "#666", margin: 0 }}>{ja ? "関連Eventはありません。" : "No related events."}</p>
          ) : (
            relatedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedRelatedEvent(event.id)}
                className={`related-card${
                  selectedRelatedEvent === event.id
                    ? " related-card--selected"
                    : ""
                }`}
              >
                <div className="related-card__header">
                  <span className="related-card__name">
                    {event.name ?? "(Unnamed Event)"}
                  </span>

                  {selectedRelatedEvent === event.id && (
                    <button
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onSelectEvent(event.id);
                      }}
                    >
                      {ja ? "できごとを編集" : "Edit Event"}
                    </button>
                  )}
                </div>

                {selectedRelatedEvent === event.id && event.description && (
                  <div className="event-description-preview">
                    {event.description.split(/\r?\n/, 1)[0]}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <br />

      <div className="detail-primary-actions">
        <button type="button" onClick={onBackToTimeline}>
          {ja ? "キャンセル" : "Cancel"}
        </button>
        <button type="button" onClick={handleSave}>
          {ja ? "エンティティを保存" : "Save Entity"}
        </button>
      </div>

      <div className="danger-zone">
        <button
          type="button"
          className="danger-action"
          onClick={() => setIsDeleteConfirmationOpen(true)}
        >
          {ja ? "エンティティを削除" : "Delete Entity"}
        </button>
      </div>

      {isDeleteConfirmationOpen && (
        <ModalDialog
          ariaLabelledby="delete-entity-heading"
          onDismiss={() => setIsDeleteConfirmationOpen(false)}
        >
          <h2 id="delete-entity-heading">Delete Entity?</h2>
          <p>
            This permanently removes the Entity and all of its connected
            Relations. Unsaved edits will also be discarded.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Keep Entity
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={() => onDeleteEntity(entity.id)}
            >
              Delete Entity
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
