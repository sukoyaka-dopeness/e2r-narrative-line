import type { Locale } from "./LocalePreferenceService";

export type DetailDiscardCopyKind =
  | "event-changes"
  | "event-draft"
  | "entity-changes"
  | "entity-create-draft";

export type ExistingDetailCopyKind = "event" | "entity";

export function getDetailDiscardCopy(
  language: Locale,
  kind: DetailDiscardCopyKind,
): string {
  if (language === "ja") {
    switch (kind) {
      case "event-changes":
      case "entity-changes":
        return "\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u3066\u623b\u308b";
      case "event-draft":
        return "\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u3066\u623b\u308b";
      case "entity-create-draft":
        return "\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u3066\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u9078\u629e\u3078\u623b\u308b";
    }
  }

  switch (kind) {
    case "event-changes":
    case "entity-changes":
      return "Discard Unsaved Changes and Return";
    case "event-draft":
      return "Discard Draft and Return";
    case "entity-create-draft":
      return "Discard Draft and Return to Entity Picker";
  }
}

export function getExistingDetailNavigationCopy(
  language: Locale,
  kind: ExistingDetailCopyKind,
  hasUnsavedChanges: boolean,
): string {
  if (!hasUnsavedChanges) return language === "ja" ? "\u623b\u308b" : "Back";
  return getDetailDiscardCopy(
    language,
    kind === "event" ? "event-changes" : "entity-changes",
  );
}
