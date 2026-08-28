export type DatasetHandoffInvalidReason =
  | "empty-dataset-url"
  | "duplicate-dataset-url"
  | "invalid-url"
  | "unsupported-scheme"
  | "embedded-credentials";

export type DatasetHandoffFragment =
  | { kind: "none" }
  | { kind: "valid"; datasetUrl: string }
  | { kind: "invalid"; reason: DatasetHandoffInvalidReason };

function fragmentParameters(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

export function validateDatasetHandoffUrl(value: string): DatasetHandoffFragment {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { kind: "invalid", reason: "invalid-url" };
  }

  if (url.protocol !== "https:") {
    return { kind: "invalid", reason: "unsupported-scheme" };
  }
  if (url.username || url.password) {
    return { kind: "invalid", reason: "embedded-credentials" };
  }

  return { kind: "valid", datasetUrl: url.href };
}

export function parseDatasetHandoffFragment(hash: string): DatasetHandoffFragment {
  const values = fragmentParameters(hash).getAll("datasetUrl");
  if (values.length === 0) return { kind: "none" };
  if (values.length > 1) return { kind: "invalid", reason: "duplicate-dataset-url" };
  if (values[0] === "") return { kind: "invalid", reason: "empty-dataset-url" };
  return validateDatasetHandoffUrl(values[0]);
}

export type DatasetHandoffFetchResult =
  | { ok: true; source: string }
  | { ok: false; reason: "fetch-failed" };

export async function fetchDatasetHandoff(
  datasetUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<DatasetHandoffFetchResult> {
  try {
    const response = await fetcher(datasetUrl, { credentials: "omit" });
    if (!response.ok) return { ok: false, reason: "fetch-failed" };
    return { ok: true, source: await response.text() };
  } catch {
    return { ok: false, reason: "fetch-failed" };
  }
}
