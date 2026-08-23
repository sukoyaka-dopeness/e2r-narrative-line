import assert from "node:assert/strict";
import test from "node:test";
import {
  hasLocaleConflict,
  clearTemporaryLocaleResolution,
  getInitialLocaleResolution,
  getLocaleChoiceLabel,
  parseRequestedLocale,
  persistLocale,
  normalizeBrowserLocale,
  readBrowserLocale,
  readPersistedLocale,
  readTemporaryLocaleResolution,
  resolveLocaleChoice,
  resolveStartupLocale,
  shouldStartHandoff,
  writeTemporaryLocaleResolution,
} from "../src/services/LocalePreferenceService.ts";

test("normalizes supported browser locale families without accepting unsupported values", () => {
  assert.equal(normalizeBrowserLocale("ja"), "ja");
  assert.equal(normalizeBrowserLocale("ja-JP"), "ja");
  assert.equal(normalizeBrowserLocale("EN-us"), "en");
  assert.equal(normalizeBrowserLocale("en"), "en");
  assert.equal(normalizeBrowserLocale("fr-FR"), undefined);
  assert.equal(normalizeBrowserLocale(""), undefined);
  assert.equal(normalizeBrowserLocale(undefined), undefined);
});

test("reads the first supported browser language and falls back to navigator.language", () => {
  assert.equal(readBrowserLocale({ languages: ["fr-FR", "ja-JP"], language: "en-US" }), "ja");
  assert.equal(readBrowserLocale({ languages: ["fr-FR", "de-DE"], language: "en-US" }), "en");
  assert.equal(readBrowserLocale({ languages: ["fr-FR", "de-DE"], language: "zh-CN" }), undefined);
  assert.equal(readBrowserLocale({ languages: [], language: undefined }), undefined);
  assert.equal(readBrowserLocale({}), undefined);
});

test("parses valid locale fragments and preserves unrelated parameters", () => {
  assert.deepEqual(parseRequestedLocale("#locale=en"), { kind: "valid", locale: "en" });
  assert.deepEqual(parseRequestedLocale("#datasetUrl=https%3A%2F%2Fa.example&locale=ja"), { kind: "valid", locale: "ja" });
  assert.deepEqual(parseRequestedLocale("#locale=ja&datasetUrl=https%3A%2F%2Fa.example&foo=1"), { kind: "valid", locale: "ja" });
});

test("ignores absent and invalid locale instructions", () => {
  assert.deepEqual(parseRequestedLocale("#datasetUrl=https%3A%2F%2Fa.example"), { kind: "none" });
  for (const hash of ["#locale=", "#locale=en&locale=ja", "#locale=fr", "#locale=ja-JP", "#locale=%E0%A4%A"]) {
    assert.deepEqual(parseRequestedLocale(hash), { kind: "invalid" });
  }
});

test("shows conflicts only for differing valid requested and saved locales", () => {
  assert.equal(hasLocaleConflict({ kind: "valid", locale: "ja" }, "en"), true);
  assert.equal(hasLocaleConflict({ kind: "valid", locale: "en" }, "ja"), true);
  assert.equal(hasLocaleConflict({ kind: "valid", locale: "en" }, "en"), false);
  assert.equal(hasLocaleConflict({ kind: "valid", locale: "ja" }, undefined), false);
  assert.equal(hasLocaleConflict({ kind: "none" }, "en"), false);
  assert.equal(hasLocaleConflict({ kind: "invalid" }, "en"), false);
});

test("permits handoff only after locale conflict resolution", () => {
  assert.equal(shouldStartHandoff(true, "unresolved"), false);
  assert.equal(shouldStartHandoff(true, "saved"), true);
  assert.equal(shouldStartHandoff(true, "requested"), true);
  assert.equal(shouldStartHandoff(false, "saved"), false);
});

test("records whether startup resolves to saved or requested language", () => {
  assert.equal(getInitialLocaleResolution({ kind: "valid", locale: "ja" }, "en"), "unresolved");
  assert.equal(getInitialLocaleResolution({ kind: "valid", locale: "en" }, "ja"), "unresolved");
  assert.equal(getInitialLocaleResolution({ kind: "valid", locale: "ja" }, undefined), "requested");
  assert.equal(getInitialLocaleResolution({ kind: "valid", locale: "en" }, "en"), "saved");
  assert.equal(getInitialLocaleResolution({ kind: "none" }, "ja"), "saved");
});

test("uses browser locale only after requested and persisted preferences", () => {
  assert.deepEqual(resolveStartupLocale({ kind: "none" }, undefined, undefined, "ja"), {
    resolution: "saved", effectiveLocale: "ja",
  });
  assert.deepEqual(resolveStartupLocale({ kind: "none" }, "en", undefined, "ja"), {
    resolution: "saved", effectiveLocale: "en",
  });
  assert.deepEqual(resolveStartupLocale({ kind: "valid", locale: "ja" }, undefined, undefined, "en"), {
    resolution: "requested", effectiveLocale: "ja",
  });
  assert.deepEqual(resolveStartupLocale({ kind: "valid", locale: "ja" }, "en", undefined, "ja"), {
    resolution: "unresolved", effectiveLocale: "en",
  });
});

test("saved and requested conflict choices produce the intended effective locale", () => {
  assert.deepEqual(resolveLocaleChoice("en", "ja", "saved"), {
    resolution: "saved",
    effectiveLocale: "en",
  });
  assert.deepEqual(resolveLocaleChoice("ja", "en", "saved"), {
    resolution: "saved",
    effectiveLocale: "ja",
  });
  assert.deepEqual(resolveLocaleChoice("en", "ja", "requested"), {
    resolution: "requested",
    effectiveLocale: "ja",
  });
  assert.deepEqual(resolveLocaleChoice("ja", "en", "requested"), {
    resolution: "requested",
    effectiveLocale: "en",
  });
});

test("locale choice labels use each target language's own language", () => {
  assert.deepEqual(getLocaleChoiceLabel("en", "saved"), { label: "Continue in English", lang: "en" });
  assert.deepEqual(getLocaleChoiceLabel("ja", "requested"), { label: "日本語で表示", lang: "ja" });
  assert.deepEqual(getLocaleChoiceLabel("ja", "saved"), { label: "日本語で続ける", lang: "ja" });
  assert.deepEqual(getLocaleChoiceLabel("en", "requested"), { label: "Show in English", lang: "en" });
});

test("storage failures are non-fatal for persisted locale reads and writes", () => {
  const failingStorage = {
    getItem() { throw new Error("read failed"); },
    setItem() { throw new Error("write failed"); },
  };
  assert.equal(readPersistedLocale(failingStorage), undefined);
  assert.doesNotThrow(() => persistLocale(failingStorage, "ja"));
});

test("reuses temporary resolution only for the same valid requested locale", () => {
  const requestedJa = { kind: "valid", locale: "ja" };
  const requestedEn = { kind: "valid", locale: "en" };
  const temporaryRequestedJa = { requestedLocale: "ja", effectiveLocale: "ja" };
  const temporarySavedEn = { requestedLocale: "ja", effectiveLocale: "en" };

  assert.deepEqual(resolveStartupLocale(requestedJa, "en", temporaryRequestedJa), {
    resolution: "requested", effectiveLocale: "ja",
  });
  assert.deepEqual(resolveStartupLocale(requestedJa, "en", temporarySavedEn), {
    resolution: "saved", effectiveLocale: "en",
  });
  assert.deepEqual(resolveStartupLocale(requestedEn, "en", temporaryRequestedJa), {
    resolution: "saved", effectiveLocale: "en",
  });
  assert.deepEqual(resolveStartupLocale({ kind: "none" }, "en", temporaryRequestedJa), {
    resolution: "saved", effectiveLocale: "en",
  });
  assert.deepEqual(resolveStartupLocale({ kind: "invalid" }, "en", temporaryRequestedJa), {
    resolution: "saved", effectiveLocale: "en",
  });
});

test("temporary storage is validated and storage failures are non-fatal", () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  writeTemporaryLocaleResolution(storage, { requestedLocale: "ja", effectiveLocale: "en" });
  assert.deepEqual(readTemporaryLocaleResolution(storage), { requestedLocale: "ja", effectiveLocale: "en" });
  values.set("narrativeline.localeTemporaryResolution", "{malformed");
  assert.equal(readTemporaryLocaleResolution(storage), undefined);

  const failingStorage = {
    getItem() { throw new Error("read failed"); },
    setItem() { throw new Error("write failed"); },
  };
  assert.equal(readTemporaryLocaleResolution(failingStorage), undefined);
  assert.doesNotThrow(() => writeTemporaryLocaleResolution(failingStorage, { requestedLocale: "ja", effectiveLocale: "ja" }));
});

test("clears temporary locale resolution without making storage failure fatal", () => {
  const values = new Map([["narrativeline.localeTemporaryResolution", '{"requestedLocale":"ja","effectiveLocale":"en"}']]);
  clearTemporaryLocaleResolution({
    removeItem(key) {
      values.delete(key);
    },
  });
  assert.equal(values.has("narrativeline.localeTemporaryResolution"), false);

  assert.doesNotThrow(() => clearTemporaryLocaleResolution({
    removeItem() {
      throw new Error("remove failed");
    },
  }));
});
