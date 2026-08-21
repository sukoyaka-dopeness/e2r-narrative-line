import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptDatasetCandidate,
  clearDatasetCandidate,
  stageDatasetCandidate,
} from "../src/services/DatasetCandidateService.ts";

const active = { version: "1.0", entities: [], events: [], relations: [] };
const acquired = { version: "1.0", entities: [{ id: "entity-1" }], events: [], relations: [] };

test("staging keeps the active Dataset separate until acceptance", () => {
  const candidate = stageDatasetCandidate(acquired, "local");

  assert.deepEqual(active, { version: "1.0", entities: [], events: [], relations: [] });
  assert.equal(candidate.dataset, acquired);
  assert.equal(candidate.source, "local");
  assert.equal(acceptDatasetCandidate(candidate), acquired);
});

test("clearing a candidate does not alter either Dataset", () => {
  const candidate = stageDatasetCandidate(acquired, "sample");

  assert.equal(clearDatasetCandidate(), null);
  assert.equal(candidate.dataset, acquired);
  assert.equal(active.entities.length, 0);
});
