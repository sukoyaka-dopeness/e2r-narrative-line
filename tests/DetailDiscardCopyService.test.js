import assert from "node:assert/strict";
import test from "node:test";
import { getDetailDiscardCopy, getExistingDetailNavigationCopy } from "../src/services/DetailDiscardCopyService.ts";

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
