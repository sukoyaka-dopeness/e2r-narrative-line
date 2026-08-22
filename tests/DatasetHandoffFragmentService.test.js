import test from "node:test";
import assert from "node:assert/strict";
import {
  removeDatasetUrlFromCurrentLocation,
  removeDatasetUrlFromHash,
  shouldRemoveDatasetUrlForAcceptedSource,
} from "../src/services/DatasetHandoffFragmentService.ts";

const encodedA = encodeURIComponent("https://example.com/a.json");
const encodedB = encodeURIComponent("https://example.com/b.json");

test("removes only datasetUrl and preserves unknown fragment parameters", () => {
  assert.equal(
    removeDatasetUrlFromHash(`#foo=bar&datasetUrl=${encodedA}&x=1`),
    "#foo=bar&x=1",
  );
});

test("removes the entire fragment when datasetUrl is the only parameter", () => {
  assert.equal(removeDatasetUrlFromHash(`#datasetUrl=${encodedA}`), "");
});

test("leaves an unknown-only fragment unchanged", () => {
  const hash = "#foo=bar&x=1";
  assert.equal(removeDatasetUrlFromHash(hash), hash);
});

test("removes duplicate and empty datasetUrl parameters", () => {
  assert.equal(
    removeDatasetUrlFromHash(`#datasetUrl=${encodedA}&foo=1&datasetUrl=${encodedB}`),
    "#foo=1",
  );
  assert.equal(
    removeDatasetUrlFromHash("#foo=1&datasetUrl=&x=2"),
    "#foo=1&x=2",
  );
});

test("replaceState preserves state, pathname, and query without pushing history", () => {
  const state = { narrativeLineView: { currentScreen: "timeline" } };
  const calls = [];
  const changed = removeDatasetUrlFromCurrentLocation(
    {
      state,
      replaceState(nextState, unused, url) {
        calls.push({ nextState, unused, url });
      },
    },
    {
      pathname: "/app/",
      search: "?mode=test",
      hash: `#foo=bar&datasetUrl=${encodedA}&x=1`,
    },
  );

  assert.equal(changed, true);
  assert.deepEqual(calls, [{
    nextState: state,
    unused: "",
    url: "/app/?mode=test#foo=bar&x=1",
  }]);
});

test("does not replace history when datasetUrl is absent", () => {
  let called = false;
  const changed = removeDatasetUrlFromCurrentLocation(
    {
      state: null,
      replaceState() {
        called = true;
      },
    },
    { pathname: "/app/", search: "", hash: "#foo=bar" },
  );

  assert.equal(changed, false);
  assert.equal(called, false);
});

test("cleans datasetUrl only after local, sample, or new Dataset acceptance", () => {
  assert.equal(shouldRemoveDatasetUrlForAcceptedSource("handoff"), false);
  assert.equal(shouldRemoveDatasetUrlForAcceptedSource("local"), true);
  assert.equal(shouldRemoveDatasetUrlForAcceptedSource("sample"), true);
  assert.equal(shouldRemoveDatasetUrlForAcceptedSource("new"), true);
});
