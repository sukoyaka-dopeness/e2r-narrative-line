import type { Locale } from "./LocalePreferenceService.ts";
import { validateDatasetHandoffUrl } from "./DatasetHandoffService.ts";

export const RELATION_INSPECT_CAPABILITY = "relation.inspect" as const;
export const RELATION_TARGET_OBJECT_TYPE = "Relation" as const;
export const TARGET_CONTRACT_VERSION = "1" as const;

export type RelationHandoffAvailability =
  | { kind: "available" }
  | { kind: "modified" }
  | { kind: "pending" }
  | { kind: "no-source" }
  | { kind: "invalid-source" }
  | { kind: "recipient-unavailable" };

export type RelationHandoffUrlInput = {
  recipientBaseUrl: string;
  datasetUrl: string;
  targetObjectId: string;
  targetObjectType?: typeof RELATION_TARGET_OBJECT_TYPE;
  requiredCapability: typeof RELATION_INSPECT_CAPABILITY;
  targetContractVersion: typeof TARGET_CONTRACT_VERSION;
  locale?: Locale;
};

type RecipientUrlOptions = {
  configuredUrl?: string;
  locationOrigin?: string;
};

function validHttpUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (url.username || url.password) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export function resolveLiaisonScapeBaseUrl({
  configuredUrl,
  locationOrigin,
}: RecipientUrlOptions): string | undefined {
  const configured = configuredUrl?.trim();
  if (configured) return validHttpUrl(configured)?.href;
  if (!locationOrigin) return undefined;

  const origin = validHttpUrl(locationOrigin);
  return origin ? new URL("/e2r-liaison-scape/", origin).href : undefined;
}

export function classifyRelationHandoffAvailability({
  datasetModified,
  pendingUserWork,
  sourceDatasetUrl,
  recipientBaseUrl,
}: {
  datasetModified: boolean;
  pendingUserWork: boolean;
  sourceDatasetUrl?: string;
  recipientBaseUrl?: string;
}): RelationHandoffAvailability {
  if (pendingUserWork) return { kind: "pending" };
  if (datasetModified) return { kind: "modified" };
  if (!sourceDatasetUrl) return { kind: "no-source" };
  if (validateDatasetHandoffUrl(sourceDatasetUrl).kind !== "valid") {
    return { kind: "invalid-source" };
  }
  if (!recipientBaseUrl || !validHttpUrl(recipientBaseUrl)) {
    return { kind: "recipient-unavailable" };
  }
  return { kind: "available" };
}

export function buildRelationHandoffUrl(input: RelationHandoffUrlInput): string {
  if (!input.targetObjectId) throw new TypeError("targetObjectId is required");
  if (input.requiredCapability !== RELATION_INSPECT_CAPABILITY) {
    throw new TypeError("unsupported required capability");
  }
  if (input.targetContractVersion !== TARGET_CONTRACT_VERSION) {
    throw new TypeError("unsupported target contract version");
  }

  const recipientUrl = validHttpUrl(input.recipientBaseUrl);
  if (!recipientUrl) throw new TypeError("recipientBaseUrl must be an HTTP(S) URL");

  const parameters = new URLSearchParams();
  parameters.set("datasetUrl", input.datasetUrl);
  parameters.set("targetObjectId", input.targetObjectId);
  if (input.targetObjectType) parameters.set("targetObjectType", input.targetObjectType);
  parameters.set("requiredCapability", input.requiredCapability);
  parameters.set("targetContractVersion", input.targetContractVersion);
  if (input.locale) parameters.set("locale", input.locale);
  recipientUrl.hash = parameters.toString();
  return recipientUrl.href;
}
