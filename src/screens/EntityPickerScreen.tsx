import { useState } from "react";
import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";

type EntityPickerScreenProps = {
  dataset: Dataset;
  eventId: string;
  onSelectEntity: (entityId: string) => void;
  onCreateEntity?: (name: string) => void;
  onCancel: () => void;
};

export function EntityPickerScreen({
  dataset,
  eventId,
  onSelectEntity,
  onCreateEntity,
  onCancel,
}: EntityPickerScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const [newEntityName, setNewEntityName] = useState("");
  const normalizedNewEntityName = newEntityName.trim();
  const relatedEntityIds = new Set(
    dataset.relations.flatMap((relation) => {
      if (relation.sourceId === eventId) {
        return [relation.targetId];
      }

      if (relation.targetId === eventId) {
        return [relation.sourceId];
      }

      return [];
    }),
  );

  return (
    <div className="detail-screen entity-picker-screen">
      <div className="detail-header">
        <h1>{ja ? "関連エンティティを追加" : "Add Related Entity"}</h1>
        <p>
          {ja ? "このできごとに関連付けるエンティティを選択してください。" : "Select an Entity to associate with this Event."}
        </p>
      </div>

      <button
        type="button"
        className="entity-picker-back entity-picker-back--inline"
        onClick={onCancel}
      >
        {ja ? "戻る" : "Back"}
      </button>

      <div className="entity-picker-create entity-picker-create--mobile">
        <button type="button" className="entity-picker-back entity-picker-back--bar" onClick={onCancel}>
          {ja ? "戻る" : "Back"}
        </button>
        <div className="entity-picker-create__form">
          <div>
            <strong>{ja ? "新しいエンティティを作成" : "Create New Entity"}</strong>
            <p>{ja ? "同じ名前のエンティティも作成できます。" : "Entities may share the same name."}</p>
          </div>
          <div className="entity-picker-create__controls">
            <input type="text" value={newEntityName} onChange={(event) => setNewEntityName(event.target.value)} placeholder={ja ? "関連する人物や組織、場所などを入力してください" : "Entity name"} />
            <button type="button" onClick={() => onCreateEntity?.(normalizedNewEntityName)} disabled={!onCreateEntity || normalizedNewEntityName.length === 0}>
              {ja ? "作成して追加" : "Create and Add"}
            </button>
          </div>
        </div>
      </div>

      {dataset.entities.length === 0 ? (
        <p>{ja ? "このDatasetにエンティティはありません。" : "No Entities are available in this Dataset."}</p>
      ) : (
        <div className="entity-picker-list">
          {dataset.entities.map((entity) => {
            const isRelated = relatedEntityIds.has(entity.id);

            return (
              <div
                key={entity.id}
                className="entity-picker-card"
              >
                <div className="entity-picker-card__name" style={{ fontWeight: 600 }}>
                  {entity.name || "(Unnamed Entity)"}
                </div>
                {entity.description && (
                  <p className="entity-picker-card__description">
                    {entity.description.split(/\r?\n/, 1)[0]}
                  </p>
                )}
                <div className="entity-picker-card__footer">
                  <button
                    type="button"
                    onClick={() => onSelectEntity(entity.id)}
                    disabled={isRelated}
                  >
                    {isRelated ? (ja ? "関連付け済み" : "Already Related") : (ja ? "関連付けを追加" : "Add Entity")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create controls are positioned above the list in document order so mobile can show them without a fixed overlay. */}
      <div className="entity-picker-create entity-picker-create--desktop-only">
        <button
          type="button"
          className="entity-picker-back entity-picker-back--bar"
          onClick={onCancel}
        >
          {ja ? "戻る" : "Back"}
        </button>
        <div className="entity-picker-create__form">
          <div>
            <strong>{ja ? "新しいエンティティを作成" : "Create New Entity"}</strong>
            <p>
              {ja ? "同じ名前のエンティティも作成できます。" : "Entities may share the same name."}
            </p>
          </div>
          <div className="entity-picker-create__controls">
          <input
            type="text"
            value={newEntityName}
            onChange={(event) => setNewEntityName(event.target.value)}
            placeholder={ja ? "関連する人物や組織、場所などを入力してください" : "Entity name"}
          />
          <button
            type="button"
            onClick={() => onCreateEntity?.(normalizedNewEntityName)}
            disabled={!onCreateEntity || normalizedNewEntityName.length === 0}
          >
            {ja ? "作成して追加" : "Create and Add"}
          </button>
          </div>
        </div>
      </div>

    </div>
  );
}
