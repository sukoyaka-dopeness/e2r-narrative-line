import type { Dataset } from "../models/Dataset";
import sampleDatasetEnJson from "./berlin-wall-history.en.e2r.json" with { type: "json" };
import sampleDatasetJaJson from "./berlin-wall-history.ja.e2r.json" with { type: "json" };
import showcaseDatasetEnJson from "./cedar-observatory-showcase.en.e2r.json" with { type: "json" };
import showcaseDatasetJaJson from "./cedar-observatory-showcase.ja.e2r.json" with { type: "json" };

export const sampleDataset = sampleDatasetJaJson as Dataset;
export const sampleDatasetEn = sampleDatasetEnJson as Dataset;
export const showcaseDataset = showcaseDatasetJaJson as Dataset;
export const showcaseDatasetEn = showcaseDatasetEnJson as Dataset;
