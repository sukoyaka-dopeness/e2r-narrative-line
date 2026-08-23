import type { DatasetCandidateSource } from "./DatasetCandidateService";
import type { Locale } from "./LocalePreferenceService";

export interface FragmentLocationLike {
  hash: string;
  pathname: string;
  search: string;
}

export interface HistoryReplaceStateLike {
  readonly state: unknown;
  replaceState: (state: unknown, unused: string, url?: string | URL | null) => void;
}

function isLocaleSegment(segment: string): boolean {
  const equalsIndex = segment.indexOf("=");
  const rawName = equalsIndex === -1 ? segment : segment.slice(0, equalsIndex);
  return decodeParameterName(rawName) === "locale";
}

function decodeParameterName(value: string): string | undefined {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return undefined;
  }
}

/** Replace the application-owned locale while preserving unrelated raw segments. */
export function setLocaleInHash(hash: string, locale: Locale): string {
  const prefix = "#";
  const payload = hash.startsWith("#") ? hash.slice(1) : hash;
  const segments = payload.split("&");
  const kept: string[] = [];
  let replaced = false;

  for (const segment of segments) {
    if (segment.length === 0) continue;
    if (!isLocaleSegment(segment)) {
      kept.push(segment);
      continue;
    }
    if (!replaced) {
      kept.push(`locale=${locale}`);
      replaced = true;
    }
  }

  if (!replaced) kept.push(`locale=${locale}`);
  return `${prefix}${kept.join("&")}`;
}

/** Replace the application-owned locale without creating a navigation entry. */
export function setLocaleInCurrentLocation(
  history: HistoryReplaceStateLike,
  location: FragmentLocationLike,
  locale: Locale,
): boolean {
  const nextHash = setLocaleInHash(location.hash, locale);
  if (nextHash === location.hash) return false;

  history.replaceState(
    history.state,
    "",
    `${location.pathname}${location.search}${nextHash}`,
  );
  return true;
}

/** Remove every datasetUrl parameter while preserving other raw fragment parameters. */
export function removeDatasetUrlFromHash(hash: string): string {
  if (!hash.startsWith("#")) return hash;

  const payload = hash.slice(1);
  const segments = payload.split("&");
  let removed = false;
  const kept: string[] = [];

  for (const segment of segments) {
    const equalsIndex = segment.indexOf("=");
    const rawName = equalsIndex === -1 ? segment : segment.slice(0, equalsIndex);
    if (decodeParameterName(rawName) === "datasetUrl") {
      removed = true;
      continue;
    }
    kept.push(segment);
  }

  if (!removed) return hash;

  const remaining = kept.filter((segment) => segment.length > 0).join("&");
  return remaining.length > 0 ? `#${remaining}` : "";
}

/** Remove datasetUrl without creating a navigation entry or changing history state. */
export function removeDatasetUrlFromCurrentLocation(
  history: HistoryReplaceStateLike,
  location: FragmentLocationLike,
): boolean {
  const nextHash = removeDatasetUrlFromHash(location.hash);
  if (nextHash === location.hash) return false;

  try {
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${location.search}${nextHash}`,
    );
    return true;
  } catch {
    // Dataset acceptance must not fail because URL cleanup is unavailable.
    return false;
  }
}

export function shouldRemoveDatasetUrlForAcceptedSource(
  source: DatasetCandidateSource,
): boolean {
  return source === "local" || source === "sample" || source === "new";
}
