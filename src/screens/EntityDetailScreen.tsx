import { useEffect, useRef, useState } from "react";
import { CoordinatePanel } from "../components/CoordinatePanel";
import { ModalDialog } from "../components/ModalDialog";
import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";
import { getPresentationMessages } from "../i18n/messages";
import type { CoordinateWriteStatus } from "../services/CoordinateService";
import { getIncidentRelations } from "../services/EntityService";
import { getRelationBlockerLabels } from "../services/RelationPresentationService";
import { getExistingDetailNavigationCopy } from "../services/DetailDiscardCopyService";

type EntityDetailScreenProps = {
  dataset: Dataset;
  selectedEntity: string | null;
  onUpdateEntity: (
    entityId: string,
    updates: { name?: string; description?: string },
  ) => void;
  onPendingWorkChange: (pending: boolean) => void;
  pendingDraft?: EntityDetailDraft;
  onDraftChange: (entityId: string, draft: EntityDetailDraft) => void;
  onClearDraft: (entityId: string) => void;
  onUpdateCoordinate: (
    objectId: string,
    spaceId: string,
    values: Record<string, number>,
  ) => CoordinateWriteStatus;
  onDeleteEntity: (entityId: string) => void;
  onDeleteRelation: (relationId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onBack: () => void;
};

export type EntityDetailDraft = { name: string; description: string };

export function EntityDetailScreen({
  dataset,
  selectedEntity,
  onUpdateEntity,
  onPendingWorkChange,
  pendingDraft,
  onDraftChange,
  onClearDraft,
  onUpdateCoordinate,
  onDeleteEntity,
  onDeleteRelation,
  onSelectEvent,
  onBack,
}: EntityDetailScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const copy = getPresentationMessages(language);
  const entity =
    dataset.entities.find((entity) => entity.id === selectedEntity) ?? null;
  const [name, setName] = useState(pendingDraft?.name ?? entity?.name ?? "");
  const [description, setDescription] = useState(
    pendingDraft?.description ?? entity?.description ?? "",
  );
  const [selectedRelatedEvent, setSelectedRelatedEvent] = useState<
    string | null
  >(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false);
  const [pendingRelationId, setPendingRelationId] = useState<string | null>(null);
  const inlineCancelRef = useRef<HTMLButtonElement>(null);
  const firstRemainingRelationRef = useRef<HTMLButtonElement>(null);
  const disposingDraftRef = useRef(false);
  const hasPendingEdits =
    entity !== null &&
    (name !== (entity.name ?? "") || description !== (entity.description ?? ""));
  useEffect(() => {
    if (pendingRelationId) inlineCancelRef.current?.focus();
  }, [pendingRelationId]);

  useEffect(() => {
    onPendingWorkChange(hasPendingEdits);
    if (!entity) return;
    if (hasPendingEdits && !disposingDraftRef.current) onDraftChange(entity.id, { name, description });
    else onClearDraft(entity.id);
  }, [entity, hasPendingEdits, name, description, onPendingWorkChange, onDraftChange, onClearDraft]);

  if (!entity) {
    return <p>{ja ? "Entityが見つかりません。" : "Entity not found."}</p>;
  }

  const handleSave = () => {
    disposingDraftRef.current = true;
    onClearDraft(entity.id);
    onUpdateEntity(entity.id, { name, description });
    onBack();
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
  const incidentRelations = getIncidentRelations(dataset, entity.id);
  const relationLabels = getRelationBlockerLabels(dataset, incidentRelations);

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <h1>{ja ? "エンティティの詳細" : "Entity Detail"}</h1>
        <p>
          {entity.name || copy.unnamedEntity}
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

      <CoordinatePanel
        key={entity.id}
        dataset={dataset}
        object={entity}
        onSaveCoordinate={(spaceId, values) =>
          onUpdateCoordinate(entity.id, spaceId, values)
        }
        onPendingWorkChange={onPendingWorkChange}
      />

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
                    {event.name ?? copy.unnamedEvent}
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
        <div className="detail-primary-actions__primary">
          <button type="button" onClick={handleSave}>
            {ja ? "エンティティを保存" : "Save Entity"}
          </button>
        </div>
        <div className="detail-primary-actions__exit">
          <button className={hasPendingEdits ? "danger-action" : undefined} type="button" onClick={() => { disposingDraftRef.current = true; onClearDraft(entity.id); onBack(); }}>
            {getExistingDetailNavigationCopy(language, "entity", hasPendingEdits)}
          </button>
        </div>
      </div>

      <div className="danger-zone">
        <button
          type="button"
          className="danger-action"
          onClick={() => incidentRelations.length > 0 ? setIsBlockedDialogOpen(true) : setIsDeleteConfirmationOpen(true)}
        >
          {ja ? "エンティティを削除" : "Delete Entity"}
        </button>
      </div>

      {isBlockedDialogOpen && (
        <ModalDialog ariaLabelledby="blocked-delete-heading" onDismiss={() => setIsBlockedDialogOpen(false)} className="entity-delete-dialog">
          <h2 id="blocked-delete-heading">{ja ? "つながりを確認してください" : "Review connections before deleting"}</h2>
          <div className="modal-actions">
            <button type="button" onClick={() => setIsBlockedDialogOpen(false)}>{ja ? "エンティティを残す" : "Keep Entity"}</button>
          </div>
          <p role="status">{ja ? `このエンティティには${incidentRelations.length}件のつながりが残っているため、まだ削除できません。` : `This Entity cannot be deleted yet because ${incidentRelations.length} connection${incidentRelations.length === 1 ? "" : "s"} remain.`}</p>
          <p>{ja ? "通常このタイムラインに表示されないつながりもあります。個別に確認して削除してください。" : "Some connections are not normally shown on this Timeline. Review and remove them individually first."}</p>
          <div className="entity-delete-connections" aria-label={ja ? "削除するつながり" : "Connections to remove"}>
            {incidentRelations.map((relation) => (
              <div className="entity-delete-connection" key={relation.id}>
                <span>{relationLabels.get(relation.id)}</span>
                {pendingRelationId === relation.id ? <span className="entity-delete-connection__confirmation" role="group" aria-label={ja ? "つながりの削除確認" : "Confirm connection removal"}>
                  <span>{ja ? "このつながりを削除しますか？" : "Remove this connection?"}</span>
                      <button ref={inlineCancelRef} type="button" onClick={() => setPendingRelationId(null)}>{ja ? "キャンセル" : "Cancel"}</button>
                  <button type="button" className="danger-action" onClick={() => { onDeleteRelation(relation.id); setPendingRelationId(null); }}>{ja ? "削除" : "Remove"}</button>
                </span> : <button ref={firstRemainingRelationRef} type="button" onClick={() => setPendingRelationId(relation.id)}>{ja ? "つながりを削除" : "Remove connection"}</button>}
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setIsBlockedDialogOpen(false)}>{ja ? "エンティティを残す" : "Keep Entity"}</button>
            {incidentRelations.length === 0 && <button type="button" className="danger-action" onClick={() => { setIsBlockedDialogOpen(false); setIsDeleteConfirmationOpen(true); }}>{ja ? "エンティティを削除" : "Delete Entity"}</button>}
          </div>
        </ModalDialog>
      )}

      {isDeleteConfirmationOpen && incidentRelations.length === 0 && (
        <ModalDialog
          ariaLabelledby="delete-entity-heading"
          onDismiss={() => setIsDeleteConfirmationOpen(false)}
        >
          <h2 id="delete-entity-heading">
            {ja ? "エンティティを削除しますか？" : "Delete Entity?"}
          </h2>
          <p>
            {ja
              ? "このエンティティと接続されているすべての関係を完全に削除します。保存していない編集も破棄されます。"
              : "This permanently removes the Entity. Unsaved edits will also be discarded."}
          </p>
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              {ja ? "エンティティを残す" : "Keep Entity"}
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={() => onDeleteEntity(entity.id)}
            >
              {ja ? "エンティティを削除" : "Delete Entity"}
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
