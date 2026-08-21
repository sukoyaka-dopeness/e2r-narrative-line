import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchDatasetHandoff,
  parseDatasetHandoffFragment,
} from "../src/services/DatasetHandoffService.ts";

test("parses one percent-encoded HTTPS dataset URL", () => {
  assert.deepEqual(
    parseDatasetHandoffFragment(
      "#foo=bar&datasetUrl=https%3A%2F%2Fdata.example%2Fhistory.e2r.json&x=1",
    ),
    { kind: "valid", datasetUrl: "https://data.example/history.e2r.json" },
  );
});

test("rejects empty and duplicate datasetUrl parameters", () => {
  assert.deepEqual(parseDatasetHandoffFragment("#datasetUrl="), {
    kind: "invalid",
    reason: "empty-dataset-url",
  });
  assert.deepEqual(
    parseDatasetHandoffFragment("#datasetUrl=https%3A%2F%2Fa.example&datasetUrl=https%3A%2F%2Fb.example"),
    { kind: "invalid", reason: "duplicate-dataset-url" },
  );
});

test("accepts only credential-free absolute HTTPS URLs", () => {
  for (const value of [
    "relative.json",
    "http://data.example/a.json",
    "file:///tmp/a.json",
    "data:application/json,{}",
    "javascript:alert(1)",
    "https://user:password@data.example/a.json",
  ]) {
    assert.equal(parseDatasetHandoffFragment(`datasetUrl=${encodeURIComponent(value)}`).kind, "invalid");
  }
});

test("fetches without credentials and returns response text", async () => {
  let receivedOptions;
  const result = await fetchDatasetHandoff(
    "https://data.example/a.json",
    async (_url, options) => {
      receivedOptions = options;
      return { ok: true, text: async () => "{\"version\":\"1.0\"}" };
    },
  );

  assert.deepEqual(receivedOptions, { credentials: "omit" });
  assert.deepEqual(result, { ok: true, source: "{\"version\":\"1.0\"}" });
});

test("reports non-success and network fetch failures", async () => {
  assert.deepEqual(
    await fetchDatasetHandoff("https://data.example/a.json", async () => ({ ok: false })),
    { ok: false, reason: "fetch-failed" },
  );
  assert.deepEqual(
    await fetchDatasetHandoff("https://data.example/a.json", async () => { throw new Error("network"); }),
    { ok: false, reason: "fetch-failed" },
  );
});
