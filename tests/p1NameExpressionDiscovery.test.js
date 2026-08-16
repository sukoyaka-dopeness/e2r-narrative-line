import assert from "node:assert/strict";
import test from "node:test";
import {
  exportDatasetJson,
  importDatasetJson,
} from "../src/services/DatasetService.ts";
import { updateEntity } from "../src/services/EntityService.ts";
import {
  discoverResearchP1Expressions,
  RESEARCH_P1_NAMES_EXTENSION_ID,
} from "../src/research/p1NameExpressionDiscovery.ts";

const source = JSON.stringify({
  version: "1.0",
  entities: [
    {
      id: "E1",
      extensions: {
        [RESEARCH_P1_NAMES_EXTENSION_ID]: {
          expressions: [
            { id: "N-ja", value: "東京", language: "ja", script: "Jpan" },
            { id: "N-en", value: "Tokyo", language: "en", script: "Latn" },
            { id: "N-tr", value: "Tōkyō", language: "en", script: "Latn" },
          ],
        },
      },
    },
    { id: "unrelated-entity", name: "Unrelated" },
  ],
  events: [],
  relations: [],
});

const opaqueRoundTripInput = {
  version: "1.0",
  entities: [
    {
      id: "names-entity",
      extensions: {
        [RESEARCH_P1_NAMES_EXTENSION_ID]: {
          expressions: [
            { id: "N-ja", value: "譚ｱ莠ｬ", language: "ja", script: "Jpan", future: null },
            { id: "N-en", value: "Tokyo", language: "en", script: "Latn", future: { keep: true } },
            { id: "N-tr", value: "Tōkyō", language: "en", script: "Latn" },
          ],
          unknown: ["first", null, { nested: "keep" }],
        },
      },
    },
    { id: "unrelated-entity", name: "Unrelated" },
  ],
  events: [],
  relations: [],
};

opaqueRoundTripInput.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID]
  .expressions[0].value = "東京";

test("discovers each exact P1 expression through NarrativeLine import and Dataset boundary", () => {
  const imported = importDatasetJson(source);

  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);
  assert.ok(imported.issues.some(({ code }) => code === "unknown_extension"));

  assert.deepEqual(discoverResearchP1Expressions(imported.dataset, "東京"), [
    { entityId: "E1", expressionId: "N-ja" },
  ]);
  assert.deepEqual(discoverResearchP1Expressions(imported.dataset, "Tokyo"), [
    { entityId: "E1", expressionId: "N-en" },
  ]);
  assert.deepEqual(discoverResearchP1Expressions(imported.dataset, "Tōkyō"), [
    { entityId: "E1", expressionId: "N-tr" },
  ]);
  assert.deepEqual(discoverResearchP1Expressions(imported.dataset, "tokyo"), []);
  assert.deepEqual(discoverResearchP1Expressions(imported.dataset, "Tōkyō "), []);

  const expressionIds = imported.dataset.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID]
    .expressions.map(({ id }) => id);
  assert.deepEqual(expressionIds, ["N-ja", "N-en", "N-tr"]);
});

test("preserves opaque P1 Names data through NarrativeLine import, edit, export, reload, and second export", () => {
  const imported = importDatasetJson(JSON.stringify(opaqueRoundTripInput));

  assert.equal(imported.isValid, true);
  assert.ok(imported.dataset);
  assert.ok(imported.issues.some(({ code }) => code === "unknown_extension"));

  const originalNames = structuredClone(
    imported.dataset.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID],
  );
  const edited = updateEntity(imported.dataset, "unrelated-entity", {
    description: "Unrelated Core edit",
  });
  const firstExport = exportDatasetJson(edited);

  assert.equal(firstExport.isValid, true);
  assert.ok(firstExport.json);
  const firstSaved = JSON.parse(firstExport.json);
  const expected = structuredClone(opaqueRoundTripInput);
  expected.entities[1].description = "Unrelated Core edit";
  assert.deepEqual(firstSaved, expected);
  assert.deepEqual(
    firstSaved.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID],
    originalNames,
  );

  const reloaded = importDatasetJson(firstExport.json);
  assert.equal(reloaded.isValid, true);
  assert.ok(reloaded.dataset);
  assert.deepEqual(
    reloaded.dataset.entities[0].extensions[RESEARCH_P1_NAMES_EXTENSION_ID],
    originalNames,
  );

  const secondExport = exportDatasetJson(reloaded.dataset);
  assert.equal(secondExport.isValid, true);
  assert.ok(secondExport.json);
  assert.deepEqual(JSON.parse(secondExport.json), firstSaved);
});
