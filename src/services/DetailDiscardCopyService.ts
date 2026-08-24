import type { Locale } from "./LocalePreferenceService";

export type DetailDiscardCopyKind =
  | "event-changes"
  | "event-draft"
  | "entity-changes"
  | "entity-create-draft";

export type ExistingDetailCopyKind = "event" | "entity";

export type DetailBackConfirmationCopy = {
  title: string;
  body: string;
  cancel: string;
  confirm: string;
};

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

export function getDetailBackConfirmationCopy(
  language: Locale,
  kind: DetailDiscardCopyKind,
): DetailBackConfirmationCopy {
  if (language === "ja") {
    const copy = {
      "event-changes": {
        title: "\u3067\u304d\u3054\u3068\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
        body: "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u3067\u304d\u3054\u3068\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
      },
      "event-draft": {
        title: "\u3067\u304d\u3054\u3068\u306e\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
        body: "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u3067\u304d\u3054\u3068\u306e\u4e0b\u66f8\u304d\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
      },
      "entity-changes": {
        title: "\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
        body: "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
      },
      "entity-create-draft": {
        title: "\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
        body: "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u4e0b\u66f8\u304d\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
      },
    }[kind];

    return {
      ...copy,
      cancel: "\u7de8\u96c6\u3092\u7d9a\u3051\u308b",
      confirm: getDetailDiscardCopy(language, kind),
    };
  }

  const copy = {
    "event-changes": {
      title: "Discard unsaved Event changes?",
      body: "Leaving this screen will discard the unsaved changes to this Event.",
    },
    "event-draft": {
      title: "Discard this draft Event?",
      body: "Leaving this screen will discard this draft Event.",
    },
    "entity-changes": {
      title: "Discard unsaved Entity changes?",
      body: "Leaving this screen will discard the unsaved changes to this Entity.",
    },
    "entity-create-draft": {
      title: "Discard this Entity draft?",
      body: "Leaving this screen will discard this Entity draft.",
    },
  }[kind];

  return {
    ...copy,
    cancel: "Continue Editing",
    confirm: getDetailDiscardCopy(language, kind),
  };
}
