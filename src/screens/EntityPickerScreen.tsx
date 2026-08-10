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
    <div className="detail-screen">
      <div className="detail-header">
        <h1>{ja ? "関連エンティティを追加" : "Add Related Entity"}</h1>
        <p>
          {ja ? "このできごとに関連付けるエンティティを選択してください。" : "Select an Entity to associate with this Event."}
        </p>
      </div>

      {dataset.entities.length === 0 ? (
        <p>{ja ? "このDatasetにエンティティはありません。" : "No Entities are available in this Dataset."}</p>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem" }}>
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

      <div style={{ marginTop: "1rem" }}>
        <h2>{ja ? "新しいエンティティを作成" : "Create New Entity"}</h2>
        <p style={{ color: "#666" }}>
          {ja ? "エンティティは同じ名前を持てます。新しいエンティティは既存のエンティティと自動的に統合されません。" : "Entities may share the same name. A new Entity will not be merged with an existing one automatically."}
        </p>
        <div className="entity-picker-create">
          <button type="button" onClick={onCancel}>
            {ja ? "キャンセル" : "Cancel"}
          </button>
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
  );
}
