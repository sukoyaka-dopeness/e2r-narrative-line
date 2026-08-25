import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

async function createHarness() {
  const environment = createDomTestEnvironment();
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  let WorkspaceMoreMenu;
  let server;
  try {
    server = await createServer({
      root: process.cwd(),
      server: { middlewareMode: true, hmr: false, port: 0, strictPort: false },
      appType: "custom",
    });
    ({ WorkspaceMoreMenu } = await server.ssrLoadModule("/src/components/WorkspaceMoreMenu.tsx"));
  } finally {
    await server?.close();
  }
  const events = [];
  const callbackFocus = [];

  await act(async () => {
    root.render(React.createElement(WorkspaceMoreMenu, {
      label: "その他",
      openDatasetLabel: "E2R Datasetを開く",
      exportDatasetLabel: "E2R JSONを書き出す",
      onOpenDataset: () => {
        events.push("open");
        callbackFocus.push({ kind: "open", activeElement: environment.document.activeElement });
      },
      onExportDataset: () => {
        events.push("export");
        callbackFocus.push({ kind: "export", activeElement: environment.document.activeElement });
      },
    }));
  });

  return {
    environment,
    root,
    events,
    callbackFocus,
    trigger: () => container.querySelector('button[aria-haspopup="menu"]'),
    menu: () => container.querySelector('[role="menu"]'),
    items: () => [...container.querySelectorAll('[role="menuitem"]')],
    cleanup() {
      act(() => root.unmount());
      environment.cleanup();
    },
  };
}

function keydown(environment, element, key) {
  act(() => element.dispatchEvent(new environment.window.KeyboardEvent("keydown", { key, bubbles: true })));
}

test("WorkspaceMoreMenu wraps ArrowUp from a fresh first-item focus", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    trigger.focus();
    act(() => trigger.click());
    const firstItem = rendered.items()[0];
    const event = new rendered.environment.window.KeyboardEvent("keydown", {
      key: "ArrowUp",
      bubbles: true,
      cancelable: true,
    });
    act(() => firstItem.dispatchEvent(event));
    assert.equal(rendered.environment.document.activeElement, rendered.items()[1]);
    assert.equal(event.defaultPrevented, true);
  } finally {
    await rendered.cleanup();
  }
});

test("WorkspaceMoreMenu preserves the two-item keyboard, focus, and activation contract", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    assert.ok(trigger);
    assert.equal(trigger.textContent, "その他");
    assert.equal(trigger.getAttribute("aria-haspopup"), "menu");
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.equal(rendered.menu(), null);

    act(() => trigger.click());
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(rendered.menu()?.getAttribute("role"), "menu");
    assert.deepEqual(rendered.items().map((item) => item.textContent), [
      "E2R Datasetを開く",
      "E2R JSONを書き出す",
    ]);
    assert.equal(rendered.environment.document.activeElement, rendered.items()[0]);

    keydown(rendered.environment, rendered.items()[0], "Escape");
    assert.equal(rendered.menu(), null);
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.equal(rendered.environment.document.activeElement, trigger);

  } finally {
    await rendered.cleanup();
  }
});

test("WorkspaceMoreMenu opens from Enter and Space without hard-coded locale behavior", async () => {
  for (const key of ["Enter", " "]) {
    const rendered = await createHarness();
    try {
      const trigger = rendered.trigger();
      trigger.focus();
      keydown(rendered.environment, trigger, key);
      assert.equal(trigger.getAttribute("aria-expanded"), "true");
      assert.equal(rendered.environment.document.activeElement, rendered.items()[0]);
    } finally {
      await rendered.cleanup();
    }
  }
});

test("WorkspaceMoreMenu keeps ArrowDown and ArrowUp navigation isolated per render", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    act(() => trigger.click());
    keydown(rendered.environment, rendered.items()[0], "ArrowDown");
    assert.equal(rendered.environment.document.activeElement, rendered.items()[1]);
    keydown(rendered.environment, rendered.items()[1], "ArrowUp");
    assert.equal(rendered.environment.document.activeElement, rendered.items()[0]);
  } finally {
    await rendered.cleanup();
  }
});

test("WorkspaceMoreMenu supports Home and End item navigation", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    act(() => trigger.click());
    keydown(rendered.environment, rendered.items()[0], "End");
    assert.equal(rendered.environment.document.activeElement, rendered.items()[1]);
    keydown(rendered.environment, rendered.items()[1], "Home");
    assert.equal(rendered.environment.document.activeElement, rendered.items()[0]);
  } finally {
    await rendered.cleanup();
  }
});

test("WorkspaceMoreMenu closes on outside click and restores trigger focus", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    act(() => trigger.click());
    const outside = rendered.environment.document.createElement("button");
    outside.type = "button";
    rendered.environment.document.body.append(outside);
    act(() => outside.dispatchEvent(new rendered.environment.window.MouseEvent("pointerdown", { bubbles: true })));
    assert.equal(rendered.menu(), null);
    assert.equal(rendered.environment.document.activeElement, trigger);
  } finally {
    await rendered.cleanup();
  }
});

test("WorkspaceMoreMenu activates each item once and closes before callback completion", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    act(() => trigger.click());
    act(() => rendered.items()[0].click());
    assert.deepEqual(rendered.events, ["open"]);
    assert.equal(rendered.callbackFocus[0].kind, "open");
    assert.equal(rendered.callbackFocus[0].activeElement, trigger);
    assert.equal(rendered.menu(), null);

    act(() => trigger.click());
    act(() => rendered.items()[1].click());
    assert.deepEqual(rendered.events, ["open", "export"]);
    assert.equal(rendered.callbackFocus[1].kind, "export");
    assert.equal(rendered.callbackFocus[1].activeElement, trigger);
    assert.equal(rendered.menu(), null);
  } finally {
    await rendered.cleanup();
  }
});

test("WorkspaceMoreMenu preserves trigger focus for native keyboard item activation", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    act(() => trigger.click());
    const item = rendered.items()[0];
    item.focus();

    const event = new rendered.environment.window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      item.dispatchEvent(event);
      // JSDOM does not synthesize a native button click from keyboard events.
      item.click();
    });

    assert.deepEqual(rendered.events, ["open"]);
    assert.equal(rendered.callbackFocus[0].activeElement, trigger);
    assert.equal(rendered.menu(), null);
  } finally {
    await rendered.cleanup();
  }
});

test("WorkspaceMoreMenu closes on Tab without preventing native traversal", async () => {
  const rendered = await createHarness();
  try {
    const trigger = rendered.trigger();
    act(() => trigger.click());
    const event = new rendered.environment.window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    act(() => rendered.items()[0].dispatchEvent(event));
    assert.equal(event.defaultPrevented, false);
    assert.equal(rendered.menu(), null);
  } finally {
    await rendered.cleanup();
  }
});
