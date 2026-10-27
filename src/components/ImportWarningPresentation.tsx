/* eslint-disable react-refresh/only-export-components -- shared pure copy and details belong to one warning presentation */
import type { DatasetImportWarning } from "../services/DatasetService";
import type { Dataset } from "../models/Dataset";
import { isKnownDimensionAssessmentNotice } from "../services/KnownSampleExtensionNotice";

type Locale = "en" | "ja";
type Scope = "current" | "candidate";

const extensionRecognitionCodes = new Set([
  "unknown_extension",
  "specification_unavailable",
  "extension_version_unspecified",
]);

export function SampleExtensionNotice({ dataset, warnings, locale, scope }: {
  dataset: Dataset;
  warnings: DatasetImportWarning[];
  locale: Locale;
  scope: Scope;
}) {
  if (!isKnownDimensionAssessmentNotice(dataset, warnings)) return null;
  return <details className="sample-extension-notice">
    <summary>{locale === "ja" ? "追加情報" : "Additional information"}</summary>
    <p>{locale === "ja"
      ? `この${scope === "candidate" ? "置き換え候補" : "Dataset"}には、Dimension Assessment 0.2.0という追加データがあります。NarrativeLineにはその内容を表示・編集する機能はありません。`
      : `This ${scope === "candidate" ? "replacement candidate" : "Dataset"} contains Dimension Assessment 0.2.0 additional data. NarrativeLine cannot display or edit its contents.`}</p>
    <p>{locale === "ja"
      ? "公式Cedarサンプルでは、読み込み・書き出し・再読み込みで追加データの保持を確認しています。このDatasetのすべての編集経路での保持や内容の正しさは保証されません。タイムラインの編集は続けられます。"
      : "The official Cedar sample retained this additional data in tested import, export, and re-import paths. This does not guarantee its validity or preservation through every edit. You can continue editing the timeline."}</p>
    <ImportWarningDetails warnings={warnings} locale={locale} />
  </details>;
}

export function getImportWarningExplanation(
  warnings: DatasetImportWarning[],
  locale: Locale,
  scope: Scope,
): string {
  if (warnings.length === 0) return "";
  const subject = scope === "candidate"
    ? locale === "ja" ? "この置き換え候補" : "This replacement candidate"
    : locale === "ja" ? "現在のDataset" : "The current Dataset";
  if (warnings.every(({ code }) => extensionRecognitionCodes.has(code))) {
    return locale === "ja"
      ? `${subject}には、このアプリで十分に確認できないExtension情報があります。該当する値がすべての編集や書き出しで保持されるとは限りません。必要に応じて診断詳細を確認してください。`
      : `${subject} contains Extension information this app cannot fully inspect. Those values are not guaranteed to survive every edit or Export. Review the diagnostic details when they matter to your work.`;
  }
  return locale === "ja"
    ? `${subject}には${warnings.length}件の診断があります。影響を受けるデータや操作を判断する前に、必要に応じて診断詳細を確認してください。`
    : `${subject} has ${warnings.length} diagnostic ${warnings.length === 1 ? "notice" : "notices"}. Review the details when assessing affected data or operations.`;
}

export function ImportWarningDetails({
  warnings,
  locale,
}: {
  warnings: DatasetImportWarning[];
  locale: Locale;
}) {
  if (warnings.length === 0) return null;
  return (
    <details className="import-warning-details">
      <summary>{locale === "ja" ? "診断詳細" : "Diagnostic details"}</summary>
      <ul>
        {warnings.map((issue, index) => (
          <li key={`${issue.code}-${issue.path}-${index}`}>
            <code>{issue.code}</code>
            {" · "}
            <span>{locale === "ja" ? "重要度" : "Severity"}: <code>{issue.severity}</code></span>
            {" · "}
            <span>Path: <code>{issue.path || "/"}</code></span>
            {"profile" in issue && <> · Profile: <code>{issue.profile}</code></>}
            {"relatedIds" in issue && issue.relatedIds?.length ? (
              <> · Related IDs: <code>{issue.relatedIds.join(", ")}</code></>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
