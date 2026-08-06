import { useState } from "react";
import type { Dataset } from "../models/Dataset";

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
        <h1>Add Related Entity</h1>
        <p>
          Select an Entity to associate with this Event.
        </p>
      </div>

      {dataset.entities.length === 0 ? (
        <p>No Entities are available in this Dataset.</p>
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
                    {isRelated ? "Already Related" : "Add Entity"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <h2>Create New Entity</h2>
        <p style={{ color: "#666" }}>
          Entities may share the same name. A new Entity will not be merged with
          an existing one automatically.
        </p>
        <div className="entity-picker-create">
          <input
            type="text"
            value={newEntityName}
            onChange={(event) => setNewEntityName(event.target.value)}
            placeholder="Entity name"
          />
          <button
            type="button"
            onClick={() => onCreateEntity?.(normalizedNewEntityName)}
            disabled={!onCreateEntity || normalizedNewEntityName.length === 0}
          >
            Create and Add
          </button>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
