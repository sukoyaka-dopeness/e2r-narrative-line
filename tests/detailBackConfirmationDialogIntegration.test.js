import assert from "node:assert/strict";
import test from "node:test";
import React, { useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { getDetailDiscardCopy } from "../src/services/DetailDiscardCopyService.ts";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

async function createHarness(persistedLocale, kind = "event-changes") {
  const environment = createDomTestEnvironment();
  if (persistedLocale) environment.window.localStorage.setItem("narrativeline.language", persistedLocale);
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, port: 0, strictPort: false }, appType: "custom" });
  const [{ DetailBackConfirmationDialog }, { LanguageProvider }] = await Promise.all([
    server.ssrLoadModule("/src/components/DetailBackConfirmationDialog.tsx"),
    server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
  ]);
  const events = [];

  function Harness({ kind }) {
    const [open, setOpen] = useState(false);
    return React.createElement(
      React.Fragment,
      null,
      React.createElement("button", { type: "button", onClick: () => setOpen(true) }, "Open confirmation"),
      open ? React.createElement(DetailBackConfirmationDialog, {
        kind,
        onCancel: () => { events.push("cancel"); setOpen(false); },
        onDiscard: () => { events.push("discard"); setOpen(false); },
      }) : null,
    );
  }

  await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(Harness, { kind }))));
  void server.close();
  return {
    environment,
    root,
    events,
    opener: container.querySelector('button[type="button"]'),
    dialog: () => container.querySelector('[role="alertdialog"]'),
    buttons: () => [...container.querySelectorAll('[role="alertdialog"] .modal-actions button')],
    cleanup() {
      act(() => root.unmount());
      environment.cleanup();
    },
  };
}

test("exercises guarded Back dialog presentation, cancellation, discard, focus, and Japanese copy", async () => {
  const rendered = await createHarness();
  try {
    rendered.opener.focus();
    act(() => rendered.opener.click());
    const dialog = rendered.dialog();
    assert.ok(dialog);
    assert.equal(dialog.querySelector("h2")?.textContent, "Discard unsaved Event changes?");
    assert.equal(dialog.querySelector("p")?.textContent, "Leaving this screen will discard the unsaved changes to this Event.");
    let buttons = rendered.buttons();
    assert.equal(buttons[0].textContent, "Continue Editing");
    assert.equal(buttons[1].textContent, getDetailDiscardCopy("en", "event-changes"));
    assert.equal(buttons[1].className, "button-danger");
    assert.equal(rendered.environment.document.activeElement, buttons[0]);

    act(() => buttons[0].click());
    assert.deepEqual(rendered.events, ["cancel"]);
    assert.equal(rendered.dialog(), null);
    assert.equal(rendered.environment.document.activeElement, rendered.opener);

    rendered.opener.focus();
    act(() => rendered.opener.click());
    const safeButton = rendered.buttons()[0];
    act(() => safeButton.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.deepEqual(rendered.events, ["cancel", "cancel"]);
    assert.equal(rendered.dialog(), null);
    assert.equal(rendered.environment.document.activeElement, rendered.opener);

    rendered.opener.focus();
    act(() => rendered.opener.click());
    const backdrop = rendered.environment.document.querySelector(".modal-backdrop");
    act(() => backdrop.dispatchEvent(new rendered.environment.window.MouseEvent("mousedown", { bubbles: true })));
    assert.deepEqual(rendered.events, ["cancel", "cancel", "cancel"]);
    assert.equal(rendered.dialog(), null);

    rendered.opener.focus();
    act(() => rendered.opener.click());
    buttons = rendered.buttons();
    act(() => buttons[1].click());
    assert.deepEqual(rendered.events, ["cancel", "cancel", "cancel", "discard"]);
    assert.equal(rendered.dialog(), null);
    assert.equal(rendered.environment.document.activeElement, rendered.opener);
  } finally {
    await rendered.cleanup();
  }

  const japanese = await createHarness("ja", "entity-create-draft");
  try {
    japanese.opener.focus();
    act(() => japanese.opener.click());
    const dialog = japanese.dialog();
    const buttons = japanese.buttons();
    assert.equal(dialog.querySelector("h2")?.textContent, "\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u4e0b\u66f8\u304d\u3092\u7834\u68c4\u3057\u307e\u3059\u304b\uff1f");
    assert.equal(dialog.querySelector("p")?.textContent, "\u3053\u306e\u753b\u9762\u3092\u96e2\u308c\u308b\u3068\u3001\u3053\u306e\u30a8\u30f3\u30c6\u30a3\u30c6\u30a3\u306e\u4e0b\u66f8\u304d\u306f\u7834\u68c4\u3055\u308c\u307e\u3059\u3002");
    assert.equal(buttons[0].textContent, "\u7de8\u96c6\u3092\u7d9a\u3051\u308b");
    assert.equal(buttons[1].textContent, getDetailDiscardCopy("ja", "entity-create-draft"));
  } finally {
    await japanese.cleanup();
  }
});
