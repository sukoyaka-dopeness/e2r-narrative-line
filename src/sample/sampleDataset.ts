import type { Dataset } from "../models/Dataset";
import sampleData from "./berlin-wall-history.json" with { type: "json" };

type SampleData = { en: Dataset; ja: Dataset };

function normalizeSample(dataset: Dataset): Dataset {
  const eventIds = new Set(dataset.events.map(({ id }) => id));
  return {
    ...dataset,
    relations: dataset.relations.map((relation) => {
      const legacyEventId = relation.sourceId.replace(/^event-/, "");
      return eventIds.has(legacyEventId)
        ? { ...relation, sourceId: legacyEventId }
        : relation;
    }),
  };
}

const data = sampleData as SampleData;

export const sampleDataset = normalizeSample(data.ja);
export const sampleDatasetEn = normalizeSample(data.en);
