import { useEffect, useMemo, useRef, useState } from "react";
import { CoordinatePanel } from "../components/CoordinatePanel";
import { ModalDialog } from "../components/ModalDialog";
import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";
import { getPresentationMessages } from "../i18n/messages";
import type { CoordinateWriteStatus } from "../services/CoordinateService";
import { getIncidentRelations } from "../services/EntityService";
import { getRelationBlockerLabels } from "../services/RelationPresentationService";
import { getExistingDetailNavigationCopy } from "../services/DetailDiscardCopyService";
import {
  getEventIdentityChronology,
  resolveEventIdentityPresentations,
} from "../services/EventIdentityPresentationService";

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
  getRelationHandoffHref?: (relationId: string) => string | undefined;
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
  getRelationHandoffHref = () => undefined,
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
  const [originRelationId, setOriginRelationId] = useState<string | null>(null);
  const [deletedRelationId, setDeletedRelationId] = useState<string | null>(null);
  const inlineCancelRef = useRef<HTMLButtonElement>(null);
  const keepEntityRef = useRef<HTMLButtonElement>(null);
  const relationTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const disposingDraftRef = useRef(false);
  const hasPendingEdits =
    entity !== null &&
    (name !== (entity.name ?? "") || description !== (entity.description ?? ""));
  const incidentRelations = useMemo(
    () => (entity ? getIncidentRelations(dataset, entity.id) : []),
    [dataset, entity],
  );
  useEffect(() => {
    if (pendingRelationId) inlineCancelRef.current?.focus();
    else if (originRelationId) relationTriggerRefs.current.get(originRelationId)?.focus();
  }, [pendingRelationId, originRelationId]);

  useEffect(() => {
    if (isBlockedDialogOpen && !pendingRelationId && !originRelationId && !deletedRelationId) {
      keepEntityRef.current?.focus();
    }
  }, [isBlockedDialogOpen, pendingRelationId, originRelationId, deletedRelationId]);

  useEffect(() => {
    if (!deletedRelationId || !isBlockedDialogOpen) return;
    const index = incidentRelations.findIndex((relation) => relation.id === deletedRelationId);
    const target = incidentRelations[index] ?? incidentRelations[index - 1] ?? incidentRelations[0];
    if (target) relationTriggerRefs.current.get(target.id)?.focus();
    else keepEntityRef.current?.focus();
  }, [incidentRelations, deletedRelationId, isBlockedDialogOpen]);
  useEffect(() => {
    onPendingWorkChange(hasPendingEdits);
    if (!entity) return;
    if (hasPendingEdits && !disposingDraftRef.current) onDraftChange(entity.id, { name, description });
    else onClearDraft(entity.id);
  }, [entity, hasPendingEdits, name, description, onPendingWorkChange, onDraftChange, onClearDraft]);

  if (!entity) {
    return <p>{ja ? "エンティティが見つかりません。" : "Entity not found."}</p>;
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
  const eventIdentity = resolveEventIdentityPresentations(relatedEvents, {
    getPrimary: (event) => event.name ?? copy.unnamedEvent,
    getChronology: getEventIdentityChronology,
  });
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
          className="entity-text-field__control"
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
          className="entity-text-field__control"
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
            <p style={{ color: "#666", margin: 0 }}>{ja ? "関連するできごとはありません。" : "No related events."}</p>
          ) : (
            relatedEvents.map((event) => {
              const identity = eventIdentity.get(event.id);

              return (
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
                    {identity?.primary ?? event.name ?? copy.unnamedEvent}
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

                {identity?.ambiguousPrimary && identity.chronologyHint && (
                  <div>
                    <small className="related-card__identity-hint">
                      {identity.chronologyHint}
                    </small>
                  </div>
                )}

                {identity?.shortIdHint && (
                  <div>
                    <small className="related-card__identity-hint">
                      {identity.shortIdHint}
                    </small>
                  </div>
                )}

                {selectedRelatedEvent === event.id && event.description && (
                  <div className="event-description-preview">
                    {event.description.split(/\r?\n/, 1)[0]}
                  </div>
                )}
                </div>
              );
            })
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
          onClick={() => {
            if (incidentRelations.length > 0) {
              setOriginRelationId(null);
              setDeletedRelationId(null);
              setPendingRelationId(null);
              setIsBlockedDialogOpen(true);
            } else {
              setIsDeleteConfirmationOpen(true);
            }
          }}
        >
          {ja ? "エンティティを削除" : "Delete Entity"}
        </button>
      </div>

      {isBlockedDialogOpen && (
        <ModalDialog ariaLabelledby="blocked-delete-heading" onDismiss={() => setIsBlockedDialogOpen(false)} className="entity-delete-dialog" initialFocusRef={keepEntityRef}>
          <h2 id="blocked-delete-heading">{ja ? "つながりを確認してください" : "Review connections before deleting"}</h2>
          <p role="status">{incidentRelations.length > 0 ? (ja ? `このエンティティには${incidentRelations.length}件のつながりが残っているため、まだ削除できません。` : `This Entity cannot be deleted yet because ${incidentRelations.length} connection${incidentRelations.length === 1 ? "" : "s"} remain.`) : (ja ? "すべてのつながりが解決されました。このエンティティを削除できます。" : "All blocking connections are resolved. This Entity can now be deleted.")}</p>
          {incidentRelations.length > 0 && <p>{ja ? "通常このタイムラインに表示されないつながりもあります。個別に確認して削除してください。" : "Some connections are not normally shown on this Timeline. Review and remove them individually first."}</p>}
          <div className="entity-delete-connections" aria-label={ja ? "削除するつながり" : "Connections to remove"}>
            {incidentRelations.map((relation) => {
              const handoffHref = getRelationHandoffHref(relation.id);
              return <div className="entity-delete-connection" key={relation.id}>
                <span className="entity-delete-connection__identity">
                  <span className="entity-delete-connection__identity-row">
                    <span className="entity-delete-connection__identity-label">{ja ? "つながりの名前" : "Relation Name"}</span>
                    <span className="entity-delete-connection__identity-value">{relationLabels.get(relation.id)?.relationName ?? ""}</span>
                  </span>
                  <span className="entity-delete-connection__identity-row">
                    <span className="entity-delete-connection__identity-label">{ja ? "始点" : "Source"}</span>
                    <span className="entity-delete-connection__identity-value">{relationLabels.get(relation.id)?.source}</span>
                  </span>
                  <span className="entity-delete-connection__identity-row">
                    <span className="entity-delete-connection__identity-label">{ja ? "終点" : "Target"}</span>
                    <span className="entity-delete-connection__identity-value">{relationLabels.get(relation.id)?.target}</span>
                  </span>
                  {relationLabels.get(relation.id)?.relationIdHint && <span className="entity-delete-connection__secondary">{relationLabels.get(relation.id)?.relationIdHint}</span>}
                </span>
                {pendingRelationId === relation.id ? <span className="entity-delete-connection__confirmation" role="group" aria-label={ja ? "つながりの削除確認" : "Confirm connection removal"}>
                  <span>{ja ? "このつながりを削除しますか？" : "Remove this connection?"}</span>
                      <button ref={inlineCancelRef} type="button" onClick={() => setPendingRelationId(null)}>{ja ? "キャンセル" : "Cancel"}</button>
                  <button type="button" className="danger-action" onClick={() => { setDeletedRelationId(relation.id); onDeleteRelation(relation.id); setPendingRelationId(null); }}>{ja ? "削除" : "Remove"}</button>
                </span> : <div className="entity-delete-connection__actions">
                  <button ref={(element) => { if (element) relationTriggerRefs.current.set(relation.id, element); else relationTriggerRefs.current.delete(relation.id); }} type="button" onClick={() => { setOriginRelationId(relation.id); setPendingRelationId(relation.id); }}>{ja ? "つながりを削除" : "Remove connection"}</button>
                  {handoffHref && <a className="entity-delete-connection__handoff" href={handoffHref}>{copy.openInLiaisonScape}</a>}
                </div>}
              </div>
            })}
          </div>
          <div className="modal-actions">
            <button ref={keepEntityRef} type="button" onClick={() => setIsBlockedDialogOpen(false)}>{ja ? "エンティティを残す" : "Keep Entity"}</button>
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
              ? "このエンティティを削除します。保存していない編集も破棄されます。"
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
