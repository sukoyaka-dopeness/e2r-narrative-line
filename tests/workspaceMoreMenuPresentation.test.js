import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("More trigger stays neutral at rest and hover while retaining a visible focus ring", async () => {
  const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
  const baseRules = [...css.matchAll(/\.workspace-more-trigger\s*\{([^}]*)\}/g)];
  const hoverRule = css.match(/\.workspace-more-trigger:hover:not\(:disabled\)\s*\{([^}]*)\}/);
  const focusRule = css.match(/\.workspace-more-trigger:focus-visible\s*\{([^}]*)\}/);

  assert.ok(baseRules.length >= 2);
  assert.match(baseRules[0][1], /background:\s*var\(--bg\);/);
  assert.match(baseRules.at(-1)[1], /color:\s*var\(--text-h\);/);
  assert.ok(hoverRule);
  assert.match(hoverRule[1], /border-color:\s*var\(--border\);/);
  assert.match(hoverRule[1], /color:\s*var\(--text-h\);/);
  assert.match(hoverRule[1], /background:\s*var\(--bg\);/);
  assert.ok(focusRule);
  assert.match(focusRule[1], /outline:\s*3px solid var\(--accent\);/);
  assert.match(focusRule[1], /outline-offset:\s*3px;/);
});
