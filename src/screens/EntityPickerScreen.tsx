import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";

type EntityPickerScreenProps = {
  dataset: Dataset;
  eventId: string;
  onSelectEntity: (entityId: string) => void;
  onOpenCreateEntity: () => void;
  onCancel: () => void;
};

export function EntityPickerScreen({
  dataset,
  eventId,
  onSelectEntity,
  onOpenCreateEntity,
  onCancel,
}: EntityPickerScreenProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
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

      <div className="detail-primary-actions">
        <button type="button" onClick={onCancel}>
          {ja ? "戻る" : "Back"}
        </button>
        <button type="button" onClick={onOpenCreateEntity}>
          {ja ? "新しいエンティティを作成" : "Create New Entity"}
        </button>
      </div>

    </div>
  );
}
