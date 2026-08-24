import assert from "node:assert/strict";
import test from "node:test";
import {
  getDetailBackConfirmationCopy,
  getDetailDiscardCopy,
  getExistingDetailNavigationCopy,
} from "../src/services/DetailDiscardCopyService.ts";

test("uses explicit English discard wording for detail changes and drafts", () => {
  assert.equal(
    getDetailDiscardCopy("en", "event-changes"),
    "Discard Unsaved Changes and Return",
  );
  assert.equal(
    getDetailDiscardCopy("en", "event-draft"),
    "Discard Draft and Return",
  );
  assert.equal(
    getDetailDiscardCopy("en", "entity-changes"),
    "Discard Unsaved Changes and Return",
  );
  assert.equal(
    getDetailDiscardCopy("en", "entity-create-draft"),
    "Discard Draft and Return to Entity Picker",
  );
});

test("uses explicit Japanese discard wording for detail changes and drafts", () => {
  assert.equal(
    getDetailDiscardCopy("ja", "event-changes"),
    "\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u3066\u623b\u308b",
  );
  assert.equal(
    getDetailDiscardCopy("ja", "event-draft"),
    "\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u3066\u623b\u308b",
  );
  assert.equal(
    getDetailDiscardCopy("ja", "entity-changes"),
    "\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u3066\u623b\u308b",
  );
  assert.equal(
    getDetailDiscardCopy("ja", "entity-create-draft"),
    "\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u3066\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u9078\u629e\u3078\u623b\u308b",
  );
});

test("uses normal navigation copy for clean existing details", () => {
  assert.equal(getExistingDetailNavigationCopy("en", "event", false), "Back");
  assert.equal(getExistingDetailNavigationCopy("ja", "event", false), "\u623b\u308b");
  assert.equal(getExistingDetailNavigationCopy("en", "entity", false), "Back");
  assert.equal(getExistingDetailNavigationCopy("ja", "entity", false), "\u623b\u308b");
});

test("uses destructive discard copy only for dirty existing details", () => {
  assert.equal(
    getExistingDetailNavigationCopy("en", "event", true),
    "Discard Unsaved Changes and Return",
  );
  assert.equal(
    getExistingDetailNavigationCopy("ja", "event", true),
    "\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u3066\u623b\u308b",
  );
  assert.equal(
    getExistingDetailNavigationCopy("en", "entity", true),
    "Discard Unsaved Changes and Return",
  );
  assert.equal(
    getExistingDetailNavigationCopy("ja", "entity", true),
    "\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u3066\u623b\u308b",
  );
});

test("provides English guarded Back confirmation copy for every safety kind", () => {
  const expected = {
    "event-changes": [
      "Discard unsaved Event changes?",
      "Leaving this screen will discard the unsaved changes to this Event.",
    ],
    "event-draft": [
      "Discard this draft Event?",
      "Leaving this screen will discard this draft Event.",
    ],
    "entity-changes": [
      "Discard unsaved Entity changes?",
      "Leaving this screen will discard the unsaved changes to this Entity.",
    ],
    "entity-create-draft": [
      "Discard this Entity draft?",
      "Leaving this screen will discard this Entity draft.",
    ],
  };

  for (const [kind, [title, body]] of Object.entries(expected)) {
    const copy = getDetailBackConfirmationCopy("en", kind);
    assert.deepEqual(copy, {
      title,
      body,
      cancel: "Continue Editing",
      confirm: getDetailDiscardCopy("en", kind),
    });
  }
});

test("provides Japanese guarded Back confirmation copy for every safety kind", () => {
  const expected = {
    "event-changes": [
      "\u3067\u304d\u3054\u3068\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
      "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u3067\u304d\u3054\u3068\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
    ],
    "event-draft": [
      "\u3067\u304d\u3054\u3068\u306e\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
      "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u3067\u304d\u3054\u3068\u306e\u4e0b\u66f8\u304d\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
    ],
    "entity-changes": [
      "\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
      "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u672a\u4fdd\u5b58\u306e\u5909\u66f4\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
    ],
    "entity-create-draft": [
      "\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f",
      "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u4e0b\u66f8\u304d\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002",
    ],
  };

  for (const [kind, [title, body]] of Object.entries(expected)) {
    const copy = getDetailBackConfirmationCopy("ja", kind);
    assert.deepEqual(copy, {
      title,
      body,
      cancel: "\u7de8\u96c6\u3092\u7d9a\u3051\u308b",
      confirm: getDetailDiscardCopy("ja", kind),
    });
  }
});
