import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRelationHandoffUrl,
  classifyRelationHandoffAvailability,
  resolveLiaisonScapeBaseUrl,
} from "../src/services/CapabilityHandoffSenderService.ts";

const datasetUrl = "https://datasets.example.test/history%20v1.json?locale=en";
const recipientBaseUrl = "https://sukoyaka-dopeness.github.io/e2r-liaison-scape/";

function buildUrl(overrides = {}) {
  return buildRelationHandoffUrl({
    recipientBaseUrl,
    datasetUrl,
    targetObjectId: "relation-full-canonical-id",
    targetObjectType: "Relation",
    requiredCapability: "relation.inspect",
    targetContractVersion: "1",
    ...overrides,
  });
}

test("builds the accepted targeted Relation inspect fragment", () => {
  const url = new URL(buildUrl({ locale: "ja" }));
  const parameters = new URLSearchParams(url.hash.slice(1));

  assert.equal(url.origin, "https://sukoyaka-dopeness.github.io");
  assert.equal(url.pathname, "/e2r-liaison-scape/");
  assert.equal(parameters.get("datasetUrl"), datasetUrl);
  assert.equal(parameters.get("targetObjectId"), "relation-full-canonical-id");
  assert.equal(parameters.get("targetObjectType"), "Relation");
  assert.equal(parameters.get("requiredCapability"), "relation.inspect");
  assert.equal(parameters.get("targetContractVersion"), "1");
  assert.equal(parameters.get("locale"), "ja");
});

test("encodes dataset and target values once at the final URL boundary", () => {
  const url = buildUrl({ targetObjectId: "relation id/with?reserved" });
  const parameters = new URLSearchParams(new URL(url).hash.slice(1));

  assert.equal(parameters.get("datasetUrl"), datasetUrl);
  assert.equal(parameters.get("targetObjectId"), "relation id/with?reserved");
  assert.equal(url.includes("history%2520v1.json"), true);
  assert.equal(parameters.get("datasetUrl").includes("%2520"), false);
});

test("preserves recipient path and query while replacing an old fragment", () => {
  const url = buildRelationHandoffUrl({
    recipientBaseUrl: `${recipientBaseUrl}?environment=test#old-state`,
    datasetUrl,
    targetObjectId: "relation-1",
    requiredCapability: "relation.inspect",
    targetContractVersion: "1",
  });

  assert.equal(new URL(url).search, "?environment=test");
  assert.equal(new URL(url).hash.includes("old-state"), false);
});

test("resolves the approved recipient from config or the current origin", () => {
  assert.equal(
    resolveLiaisonScapeBaseUrl({ configuredUrl: "http://localhost:4173/e2r-liaison-scape/" }),
    "http://localhost:4173/e2r-liaison-scape/",
  );
  assert.equal(
    resolveLiaisonScapeBaseUrl({ locationOrigin: "https://narrativeline.example.test" }),
    "https://narrativeline.example.test/e2r-liaison-scape/",
  );
  assert.equal(
    resolveLiaisonScapeBaseUrl({ configuredUrl: "https://user:pass@example.test/" }),
    undefined,
  );
});

test("allows only clean, pending-free, retrievable HTTPS source state", () => {
  const base = {
    datasetModified: false,
    pendingUserWork: false,
    sourceDatasetUrl: "https://datasets.example.test/current.json",
    recipientBaseUrl,
  };

  assert.deepEqual(classifyRelationHandoffAvailability(base), { kind: "available" });
  assert.deepEqual(classifyRelationHandoffAvailability({ ...base, pendingUserWork: true }), { kind: "pending" });
  assert.deepEqual(classifyRelationHandoffAvailability({ ...base, datasetModified: true }), { kind: "modified" });
  assert.deepEqual(classifyRelationHandoffAvailability({ ...base, sourceDatasetUrl: undefined }), { kind: "no-source" });
  assert.deepEqual(classifyRelationHandoffAvailability({ ...base, sourceDatasetUrl: "http://datasets.example.test/current.json" }), { kind: "invalid-source" });
  assert.deepEqual(classifyRelationHandoffAvailability({ ...base, sourceDatasetUrl: "not a URL" }), { kind: "invalid-source" });
  assert.deepEqual(classifyRelationHandoffAvailability({ ...base, recipientBaseUrl: undefined }), { kind: "recipient-unavailable" });
});

test("builder rejects unsupported capability and missing canonical target", () => {
  assert.throws(
    () => buildUrl({ requiredCapability: "relation.delete" }),
    /unsupported required capability/,
  );
  assert.throws(
    () => buildUrl({ targetObjectId: "" }),
    /targetObjectId is required/,
  );
});
