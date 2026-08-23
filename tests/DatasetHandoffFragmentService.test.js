import test from "node:test";
import assert from "node:assert/strict";
import {
  removeDatasetUrlFromCurrentLocation,
  removeDatasetUrlFromHash,
  setLocaleInCurrentLocation,
  setLocaleInHash,
  shouldRemoveDatasetUrlForAcceptedSource,
} from "../src/services/DatasetHandoffFragmentService.ts";

const encodedA = encodeURIComponent("https://example.com/a.json");
const encodedB = encodeURIComponent("https://example.com/b.json");

test("adds locale to an empty fragment and appends when absent", () => {
  assert.equal(setLocaleInHash("", "ja"), "#locale=ja");
  assert.equal(setLocaleInHash("#foo=bar", "ja"), "#foo=bar&locale=ja");
});

test("replaces locale while preserving unrelated raw segments", () => {
  const hash = "#datasetUrl=https%3A%2F%2Fa.example%2Fdata.json&foo=a%2Fb&locale=en&x=&tag=1&tag=2";
  assert.equal(
    setLocaleInHash(hash, "ja"),
    "#datasetUrl=https%3A%2F%2Fa.example%2Fdata.json&foo=a%2Fb&locale=ja&x=&tag=1&tag=2",
  );
});

test("repairs duplicate, invalid, empty, and malformed locale values", () => {
  assert.equal(setLocaleInHash("#foo=1&locale=en&x=2&locale=ja&y=3", "en"), "#foo=1&locale=en&x=2&y=3");
  assert.equal(setLocaleInHash("#locale=fr&foo=bar", "ja"), "#locale=ja&foo=bar");
  assert.equal(setLocaleInHash("#locale=&foo=bar", "en"), "#locale=en&foo=bar");
  assert.equal(setLocaleInHash("#locale=%malformed&foo=bar", "ja"), "#locale=ja&foo=bar");
  assert.equal(setLocaleInHash("#locales=fr&localeX=en&xlocale=ja", "ja"), "#locales=fr&localeX=en&xlocale=ja&locale=ja");
});

test("locale replaceState preserves state, path, query, and avoids pushState", () => {
  const state = { narrativeLineView: "timeline", other: "value" };
  const calls = [];
  let pushed = false;
  assert.equal(setLocaleInCurrentLocation({
    state,
    replaceState(nextState, unused, url) { calls.push({ nextState, unused, url }); },
  }, {
    pathname: "/path/to/app",
    search: "?debug=1",
    hash: "#foo=bar",
  }, "ja"), true);
  assert.deepEqual(calls, [{ nextState: state, unused: "", url: "/path/to/app?debug=1#foo=bar&locale=ja" }]);
  assert.equal(pushed, false);
});

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
