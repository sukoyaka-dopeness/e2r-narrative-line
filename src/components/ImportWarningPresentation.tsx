/* eslint-disable react-refresh/only-export-components -- shared pure copy and details belong to one warning presentation */
import type { DatasetImportWarning } from "../services/DatasetService";

type Locale = "en" | "ja";
type Scope = "current" | "candidate";

const extensionRecognitionCodes = new Set([
  "unknown_extension",
  "specification_unavailable",
  "extension_version_unspecified",
]);

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
