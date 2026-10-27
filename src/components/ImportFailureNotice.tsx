import type { DatasetImportIssue } from "../services/DatasetService";

type Props = {
  issues: DatasetImportIssue[];
  locale: "en" | "ja";
  headingId: string;
  hasCurrentDataset: boolean;
};

export function ImportFailureNotice({ issues, locale, headingId, hasCurrentDataset }: Props) {
  if (issues.length === 0) return null;
  const ja = locale === "ja";
  const syntaxError = issues.some((issue) => issue.code === "json_parse_error");
  const explanation = syntaxError
    ? ja
      ? "選択したファイルをJSONとして読み取れませんでした。JSONの書式を確認するか、元のアプリからE2R Datasetを書き出し直して再試行してください。"
      : "The selected file is not readable JSON. Check its JSON syntax, or export the E2R Dataset again from its source app and retry."
    : ja
      ? "選択したファイルはE2R Datasetの検証を通過しませんでした。ファイルの内容と形式を確認し、必要に応じて診断詳細の箇所を修正してから再試行してください。"
      : "The selected file did not pass E2R Dataset validation. Check its content and format, then use the diagnostic details to locate issues before retrying.";
  const retention = hasCurrentDataset
    ? ja
      ? "現在のDatasetは置き換えられていません。下の「読み込み情報」は現在のDatasetについての情報であり、今回失敗したファイルの診断ではありません。"
      : "The current Dataset was not replaced. The Import information below describes the current Dataset, not this failed file."
    : ja
      ? "このファイルからDatasetは開かれていません。ブラウザーに保存済みのDatasetは、この失敗によって置き換えられていません。"
      : "No Dataset was opened from this file. This failure did not replace a Dataset saved in this browser.";

  return (
    <section className="import-failure-notice" role="alert" aria-labelledby={headingId}>
      <h2 id={headingId}>{ja ? "読み込みに失敗しました" : "Import failed"}</h2>
      <p>{explanation}</p>
      <p>{retention}</p>
      <details>
        <summary>{ja ? "失敗の診断詳細" : "Failure diagnostic details"}</summary>
        <ul>
          {issues.map((issue, index) => (
            <li key={`${issue.code}-${issue.path}-${index}`}>
              <code>{issue.code}</code>
              {" · "}
              <span>Path: <code>{issue.path === "" ? '"" (document root)' : issue.path}</code></span>
              {"severity" in issue && <> · {ja ? "重要度" : "Severity"}: <code>{issue.severity}</code></>}
              {"profile" in issue && <> · Profile: <code>{issue.profile}</code></>}
              {"relatedIds" in issue && issue.relatedIds?.length ? <> · Related IDs: <code>{issue.relatedIds.join(", ")}</code></> : null}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
