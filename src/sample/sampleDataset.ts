import type { Dataset } from "../models/Dataset";
import sampleDatasetEnJson from "./berlin-wall-history.en.e2r.json" with { type: "json" };
import sampleDatasetJaJson from "./berlin-wall-history.ja.e2r.json" with { type: "json" };

export const sampleDataset = sampleDatasetJaJson as Dataset;
export const sampleDatasetEn = sampleDatasetEnJson as Dataset;
