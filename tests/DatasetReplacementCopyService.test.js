import assert from "node:assert/strict";
import test from "node:test";
import { getDatasetReplacementCopy } from "../src/services/DatasetReplacementCopyService.ts";

test("provides the existing English D6 copy for every state", () => {
  assert.deepEqual(getDatasetReplacementCopy("en", "modified-only"), {
    title: "Replace the current Dataset?",
    body: "The current Dataset has changes that have not been exported.",
    cancel: "Cancel",
    discard: "Discard and Continue",
    exportAndContinue: "Export and Continue",
  });
  assert.deepEqual(getDatasetReplacementCopy("en", "pending-only"), {
    title: "Discard pending work?",
    body: "Pending edits may not be included in an exported Dataset.",
    cancel: "Cancel",
    discard: "Discard and Continue",
  });
  assert.deepEqual(getDatasetReplacementCopy("en", "modified-and-pending"), {
    title: "Replace the current Dataset?",
    body: "The current Dataset has changes and pending edits that are not all protected by export.",
    cancel: "Cancel",
    discard: "Discard work and Continue",
    exportDataset: "Export Dataset",
  });
});

test("provides Japanese copy for every D6 state", () => {
  assert.deepEqual(getDatasetReplacementCopy("ja", "modified-only"), {
    title: "現在のDatasetを置き換えますか？",
    body: "現在のDatasetには、まだ書き出していない変更があります。",
    cancel: "キャンセル",
    discard: "破棄して続行",
    exportAndContinue: "書き出して続行",
  });
  assert.deepEqual(getDatasetReplacementCopy("ja", "pending-only"), {
    title: "未保存の作業を破棄しますか？",
    body: "未保存の編集内容は、書き出したDatasetに含まれない可能性があります。",
    cancel: "キャンセル",
    discard: "作業を破棄して続行",
  });
  assert.deepEqual(getDatasetReplacementCopy("ja", "modified-and-pending"), {
    title: "現在のDatasetを置き換えますか？",
    body: "現在のDatasetには変更と未保存の編集があり、そのすべてが書き出しによって保護されるわけではありません。",
    cancel: "キャンセル",
    discard: "作業を破棄して続行",
    exportDataset: "Datasetを書き出す",
  });
});
