export type Locale = "en" | "ja";

export type RequestedLocale =
  | { kind: "none" }
  | { kind: "valid"; locale: Locale }
  | { kind: "invalid" };

export type LocaleResolution = "unresolved" | "saved" | "requested";

export type LocaleChoice = "saved" | "requested";

export type TemporaryLocaleResolution = {
  requestedLocale: Locale;
  effectiveLocale: Locale;
};

export type StartupLocaleDecision = {
  resolution: LocaleResolution;
  effectiveLocale: Locale;
};

export type LocaleChoiceLabel = {
  label: string;
  lang: Locale;
};

export function getLocaleChoiceLabel(
  locale: Locale,
  choice: LocaleChoice,
): LocaleChoiceLabel {
  if (locale === "ja") {
    return { label: choice === "saved" ? "日本語で続ける" : "日本語で表示", lang: "ja" };
  }
  return { label: choice === "saved" ? "Continue in English" : "Show in English", lang: "en" };
}

export function readPersistedLocale(storage: Storage): Locale | undefined {
  try {
    const value = storage.getItem("narrativeline.language");
    return value === "en" || value === "ja" ? value : undefined;
  } catch {
    return undefined;
  }
}

export function persistLocale(storage: Storage, locale: Locale): void {
  try {
    storage.setItem("narrativeline.language", locale);
  } catch {
    // The visible UI preference remains usable when storage is unavailable.
  }
}

export function readTemporaryLocaleResolution(
  storage: Storage,
): TemporaryLocaleResolution | undefined {
  try {
    const raw = storage.getItem("narrativeline.localeTemporaryResolution");
    if (!raw) return undefined;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return undefined;
    const candidate = value as Record<string, unknown>;
    if (
      (candidate.requestedLocale !== "en" && candidate.requestedLocale !== "ja") ||
      (candidate.effectiveLocale !== "en" && candidate.effectiveLocale !== "ja")
    ) return undefined;
    return {
      requestedLocale: candidate.requestedLocale,
      effectiveLocale: candidate.effectiveLocale,
    };
  } catch {
    return undefined;
  }
}

export function writeTemporaryLocaleResolution(
  storage: Storage,
  resolution: TemporaryLocaleResolution,
): void {
  try {
    storage.setItem("narrativeline.localeTemporaryResolution", JSON.stringify(resolution));
  } catch {
    // Session persistence is an optimization; the current startup must continue.
  }
}

function decode(value: string): string | undefined {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return undefined;
  }
}

export function parseRequestedLocale(hash: string): RequestedLocale {
  if (!hash.startsWith("#")) return { kind: "none" };

  let found: string | undefined;
  let count = 0;
  for (const segment of hash.slice(1).split("&")) {
    if (segment === "") continue;
    const equalsIndex = segment.indexOf("=");
    const rawName = equalsIndex === -1 ? segment : segment.slice(0, equalsIndex);
    const name = decode(rawName);
    if (name !== "locale") continue;

    count += 1;
    const rawValue = equalsIndex === -1 ? "" : segment.slice(equalsIndex + 1);
    found = decode(rawValue);
  }

  if (count === 0) return { kind: "none" };
  if (count !== 1 || found === undefined) return { kind: "invalid" };
  if (found === "en" || found === "ja") return { kind: "valid", locale: found };
  return { kind: "invalid" };
}

export function hasLocaleConflict(
  requested: RequestedLocale,
  persisted: Locale | undefined,
): boolean {
  return requested.kind === "valid" && persisted !== undefined && requested.locale !== persisted;
}

export function getInitialLocaleResolution(
  requested: RequestedLocale,
  persisted: Locale | undefined,
): LocaleResolution {
  if (hasLocaleConflict(requested, persisted)) return "unresolved";
  return requested.kind === "valid" && persisted === undefined ? "requested" : "saved";
}

export function resolveStartupLocale(
  requested: RequestedLocale,
  persisted: Locale | undefined,
  temporary: TemporaryLocaleResolution | undefined,
): StartupLocaleDecision {
  if (requested.kind === "valid" && temporary?.requestedLocale === requested.locale) {
    return {
      resolution: temporary.effectiveLocale === requested.locale ? "requested" : "saved",
      effectiveLocale: temporary.effectiveLocale,
    };
  }

  if (hasLocaleConflict(requested, persisted)) {
    return { resolution: "unresolved", effectiveLocale: persisted ?? "en" };
  }
  if (requested.kind === "valid" && persisted === undefined) {
    return { resolution: "requested", effectiveLocale: requested.locale };
  }
  return { resolution: "saved", effectiveLocale: persisted ?? "en" };
}

export function resolveLocaleChoice(
  saved: Locale,
  requested: Locale,
  choice: LocaleChoice,
): { resolution: Exclude<LocaleResolution, "unresolved">; effectiveLocale: Locale } {
  return choice === "requested"
    ? { resolution: "requested", effectiveLocale: requested }
    : { resolution: "saved", effectiveLocale: saved };
}

export function shouldStartHandoff(
  handoffIsValid: boolean,
  localeResolution: LocaleResolution,
): boolean {
  return handoffIsValid && localeResolution !== "unresolved";
}
