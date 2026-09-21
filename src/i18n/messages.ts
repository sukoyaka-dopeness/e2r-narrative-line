import type { Locale } from "../services/LocalePreferenceService";

const englishMessages = {
  handoffLoading: "Opening the handed-off Dataset…",
  more: "More",
  openDataset: "Open E2R Dataset",
  sampleInfo: "Sample info",
  exportDataset: "Export E2R JSON",
  openInLiaisonScape: "Open in LiaisonScape",
  localFileReadFailure: "The selected file could not be read.",
  creditsCreatedByLabel: "Created by",
  creditsReleasedLabel: "Released",
  creditsGratitude: "With gratitude to all the AI systems that contributed to this project.",
  creditsNarrativeLineRepository: "NarrativeLine repository",
  creditsSpecificationRepository: "E2R specification repository",
  datasetTitleLabel: "Dataset title",
  exportFailure: "The Dataset could not be exported.",
  replacementExportFailure: "The current Dataset could not be exported. The replacement was not performed.",
  unnamedEvent: "(Unnamed Event)",
  unnamedEntity: "(Unnamed Entity)",
  spaceLabel: "Space",
  historyYearMustBeInteger: "Year must be an integer.",
  historyMonthRequiresYear: "Month requires a year.",
  historyMonthMustBeInteger: "Month must be an integer.",
  historyMonthOutOfRange: "Month must be between 1 and 12.",
  historyDayRequiresMonth: "Day requires a year and month.",
  historyDayMustBeInteger: "Day must be an integer.",
  historyDayOutOfRange: "Day is not valid for the selected year and month.",
  historyHourRequiresDay: "Hour requires a complete date.",
  historyHourMustBeInteger: "Hour must be an integer.",
  historyHourOutOfRange: "Hour must be between 0 and 23.",
  historyMinuteMustBeInteger: "Minute must be an integer.",
  historyMinuteOutOfRange: "Minute must be between 0 and 59.",
  historySecondMustBeInteger: "Second must be an integer.",
  historySecondOutOfRange: "Second must be between 0 and 59.",
  historyReadOnlyNotice: "This History data is currently read-only in NarrativeLine. The existing date editor cannot safely edit it.",
  cancel: "Cancel",
  historyApproximationLabel: "Mark the date and time as approximate",
  historyApproximationNotice: "This date and time is approximate. The Timeline uses the entered date and time without creating a range or midpoint.",
  historyUpgradeHeading: "Record this date and time as approximate?",
  historyUpgradeDescription: "Saving this change will update compatible recorded dates and times in this Dataset to the History 2 representation. Their meaning and precision will be preserved; no precise date/time range will be inferred. Canceling leaves the Dataset unchanged.",
  historyUpgradeConfirm: "Save as approximate",
  historyUpgradeRefusal: "This Dataset contains History data that cannot be safely upgraded to History 2. No changes were saved.",
} as const;

type MessageKey = keyof typeof englishMessages;
export type PresentationMessages = Record<MessageKey, string>;

const japaneseMessages: PresentationMessages = {
  handoffLoading: "HandoffリンクからDatasetを開いています…",
  more: "その他",
  openDataset: "E2R Datasetを開く",
  sampleInfo: "サンプル情報",
  exportDataset: "E2R JSONを書き出す",
  openInLiaisonScape: "LiaisonScapeで開く",
  localFileReadFailure: "選択したファイルを読み込めませんでした。",
  creditsCreatedByLabel: "作成者",
  creditsReleasedLabel: "公開日",
  creditsGratitude: "このプロジェクトに貢献したすべてのAIシステムに感謝します。",
  creditsNarrativeLineRepository: "NarrativeLineリポジトリ",
  creditsSpecificationRepository: "E2R仕様リポジトリ",
  datasetTitleLabel: "Datasetタイトル",
  exportFailure: "Datasetを書き出せませんでした。",
  replacementExportFailure: "現在のDatasetを書き出せなかったため、置き換えを実行しませんでした。",
  unnamedEvent: "（名前のないできごと）",
  unnamedEntity: "（名前のないエンティティ）",
  spaceLabel: "スペース",
  historyYearMustBeInteger: "年は整数で入力してください。",
  historyMonthRequiresYear: "月を入力するには年が必要です。",
  historyMonthMustBeInteger: "月は整数で入力してください。",
  historyMonthOutOfRange: "月は1から12の範囲で入力してください。",
  historyDayRequiresMonth: "日を入力するには年と月が必要です。",
  historyDayMustBeInteger: "日は整数で入力してください。",
  historyDayOutOfRange: "選択した年月の日付として正しくありません。",
  historyHourRequiresDay: "時刻を入力するには完全な日付が必要です。",
  historyHourMustBeInteger: "時は整数で入力してください。",
  historyHourOutOfRange: "時は0から23の範囲で入力してください。",
  historyMinuteMustBeInteger: "分は整数で入力してください。",
  historyMinuteOutOfRange: "分は0から59の範囲で入力してください。",
  historySecondMustBeInteger: "秒は整数で入力してください。",
  historySecondOutOfRange: "秒は0から59の範囲で入力してください。",
  historyReadOnlyNotice: "このHistoryデータは現在NarrativeLineで読み取り専用です。既存の日付エディターでは安全に編集できません。",
  cancel: "キャンセル",
  historyApproximationLabel: "日付と時刻をおおよその値として記録",
  historyApproximationNotice: "この日付と時刻はおおよその値です。Timelineでは入力した日付と時刻を使い、範囲や中央値は作成しません。",
  historyUpgradeHeading: "日付と時刻をおおよその値として記録しますか？",
  historyUpgradeDescription: "この変更を保存すると、このDataset内の互換性のある記録日時もHistory 2形式へ更新されます。記録日時の意味と精度は保持され、正確な日時範囲は推測されません。キャンセルした場合、Dataset全体は変更されません。",
  historyUpgradeConfirm: "おおよその日付と時刻として保存",
  historyUpgradeRefusal: "このDatasetには安全にHistory 2形式へ更新できないHistoryデータが含まれています。変更は保存されませんでした。",
};

export const messages: Record<Locale, PresentationMessages> = {
  en: englishMessages,
  ja: japaneseMessages,
};

export function getPresentationMessages(locale: Locale): PresentationMessages {
  return messages[locale];
}

export function formatEventCount(locale: Locale, count: number): string {
  return locale === "ja" ? `${count}件のできごと` : `${count} events`;
}
