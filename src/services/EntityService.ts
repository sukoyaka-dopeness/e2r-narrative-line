import type { Dataset } from "../models/Dataset";
import { createCoreObjectId } from "./IdentifierService.ts";

type AddEntityResult = {
  dataset: Dataset;
  entityId: string;
};

export function addEntity(dataset: Dataset, name: string): AddEntityResult {
  const entityId = createCoreObjectId(dataset);

  return {
    dataset: {
      ...dataset,
      entities: [
        ...dataset.entities,
        {
          id: entityId,
          name,
          description: "",
        },
      ],
    },
    entityId,
  };
}

export function updateEntity(
  dataset: Dataset,
  entityId: string,
  updates: {
    name?: string;
    description?: string;
  },
): Dataset {
  return {
    ...dataset,
    entities: dataset.entities.map((entity) =>
      entity.id === entityId
        ? {
            ...entity,
            ...updates,
          }
        : entity,
    ),
  };
}

export function deleteEntity(
  dataset: Dataset,
  entityId: string,
): Dataset {
  return {
    ...dataset,
    entities: dataset.entities.filter((entity) => entity.id !== entityId),
    relations: dataset.relations.filter(
      (relation) =>
        relation.sourceId !== entityId && relation.targetId !== entityId,
    ),
  };
}
