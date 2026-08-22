export type DatasetReplacementLanguage = "en" | "ja";

export type DatasetReplacementState =
  | "modified-only"
  | "pending-only"
  | "modified-and-pending";

export type DatasetReplacementCopy = {
  title: string;
  body: string;
  cancel: string;
  discard: string;
  exportAndContinue?: string;
  exportDataset?: string;
};

const englishCopy: Record<DatasetReplacementState, DatasetReplacementCopy> = {
  "modified-only": {
    title: "Replace the current Dataset?",
    body: "The current Dataset has changes that have not been exported.",
    cancel: "Cancel",
    discard: "Discard and Continue",
    exportAndContinue: "Export and Continue",
  },
  "pending-only": {
    title: "Discard pending work?",
    body: "Pending edits may not be included in an exported Dataset.",
    cancel: "Cancel",
    discard: "Discard and Continue",
  },
  "modified-and-pending": {
    title: "Replace the current Dataset?",
    body: "The current Dataset has changes and pending edits that are not all protected by export.",
    cancel: "Cancel",
    discard: "Discard work and Continue",
    exportDataset: "Export Dataset",
  },
};

const japaneseCopy: Record<DatasetReplacementState, DatasetReplacementCopy> = {
  "modified-only": {
    title: "現在のDatasetを置き換えますか？",
    body: "現在のDatasetには、まだ書き出していない変更があります。",
    cancel: "キャンセル",
    discard: "破棄して続行",
    exportAndContinue: "書き出して続行",
  },
  "pending-only": {
    title: "未保存の作業を破棄しますか？",
    body: "未保存の編集内容は、書き出したDatasetに含まれない可能性があります。",
    cancel: "キャンセル",
    discard: "作業を破棄して続行",
  },
  "modified-and-pending": {
    title: "現在のDatasetを置き換えますか？",
    body: "現在のDatasetには変更と未保存の編集があり、そのすべてが書き出しによって保護されるわけではありません。",
    cancel: "キャンセル",
    discard: "作業を破棄して続行",
    exportDataset: "Datasetを書き出す",
  },
};

export function getDatasetReplacementCopy(
  language: DatasetReplacementLanguage,
  state: DatasetReplacementState,
): DatasetReplacementCopy {
  return (language === "ja" ? japaneseCopy : englishCopy)[state];
}
