import assert from "node:assert/strict";
import test from "node:test";
import {
  forgetAcceptedHandoff,
  isAcceptedHandoffReload,
  rememberAcceptedHandoff,
  rememberSavedHandoffDataset,
} from "../src/services/AcceptedHandoffRecognitionService.ts";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const url = "https://example.test/cedar-ja.json";
const accepted = { version: "1.0", entities: [], events: [{ id: "cedar" }], relations: [] };
const edited = { ...accepted, events: [{ id: "cedar", name: "Saved edit" }] };

function matches(cache, overrides = {}) {
  return isAcceptedHandoffReload({
    storage: cache,
    datasetUrl: url,
    fetchedDataset: accepted,
    savedDatasetJson: JSON.stringify(accepted),
    ...overrides,
  });
}

test("only the accepted URL, source content, and exact saved snapshot suppress repeat confirmation", () => {
  const cache = storage();
  assert.equal(matches(cache), false);
  rememberAcceptedHandoff(cache, url, JSON.stringify(accepted));
  assert.equal(matches(cache), true);
  assert.equal(matches(cache, { datasetUrl: "https://example.test/other.json" }), false);
  assert.equal(matches(cache, { fetchedDataset: edited }), false);
  assert.equal(matches(cache, { savedDatasetJson: JSON.stringify(edited) }), false);
  assert.equal(matches(cache, { savedDatasetJson: null }), false);

  rememberSavedHandoffDataset(cache, JSON.stringify(edited));
  assert.equal(matches(cache, { savedDatasetJson: JSON.stringify(edited) }), true);
  assert.equal(matches(cache), false);
  forgetAcceptedHandoff(cache);
  assert.equal(matches(cache, { savedDatasetJson: JSON.stringify(edited) }), false);
});

test("unavailable recognition storage fails closed without changing Dataset bytes", () => {
  const blocked = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
    removeItem: () => { throw new Error("blocked"); },
  };
  assert.equal(matches(blocked), false);
  assert.doesNotThrow(() => rememberAcceptedHandoff(blocked, url, JSON.stringify(accepted)));
  assert.doesNotThrow(() => rememberSavedHandoffDataset(blocked, JSON.stringify(edited)));
  assert.doesNotThrow(() => forgetAcceptedHandoff(blocked));
});

test("tab-local recognition reacts to shared saved Dataset changes without trusting another tab", () => {
  const tabA = storage();
  const tabB = storage();
  rememberAcceptedHandoff(tabA, url, JSON.stringify(accepted));
  rememberSavedHandoffDataset(tabA, JSON.stringify(edited));
  let sharedSaved = JSON.stringify(edited);
  assert.equal(matches(tabA, { savedDatasetJson: sharedSaved }), true);
  assert.equal(matches(tabB, { savedDatasetJson: sharedSaved }), false);

  // A new tab with an opener may begin with a copy, but the copies diverge.
  const key = "narrativeline.acceptedHandoffRecognition.v1";
  tabB.setItem(key, tabA.getItem(key));
  assert.equal(matches(tabB, { savedDatasetJson: sharedSaved }), true);
  rememberSavedHandoffDataset(tabB, JSON.stringify(accepted));
  assert.equal(matches(tabA, { savedDatasetJson: sharedSaved }), true);

  // A refused save leaves the shared bytes alone; a successful peer edit does not.
  assert.equal(matches(tabA, { savedDatasetJson: sharedSaved }), true);
  sharedSaved = JSON.stringify({ ...edited, events: [{ id: "peer-edit" }] });
  assert.equal(matches(tabA, { savedDatasetJson: sharedSaved }), false);
  assert.equal(matches(tabB, { savedDatasetJson: sharedSaved }), false);
});
