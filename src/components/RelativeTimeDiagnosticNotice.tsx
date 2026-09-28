import type { RelativeTimeEvidenceState } from "../services/RelativeTimeService.ts";
import { useLanguage } from "../i18n/LanguageContext";

export function RelativeTimeDiagnosticNotice({
  state,
}: {
  state: RelativeTimeEvidenceState;
}) {
  const { language } = useLanguage();
  if (state !== "diagnostic") return null;
  return (
    <p className="relative-time-diagnostic-notice" role="status">
      {language === "ja"
        ? "このDatasetにはNarrativeLineが完全には解釈できないRelative Time情報があります。情報は保持され、編集は対応できる記録に限られます。"
        : "This Dataset contains Relative Time information that NarrativeLine cannot fully interpret. It is preserved; editing is available only for supported records."}
    </p>
  );
}
