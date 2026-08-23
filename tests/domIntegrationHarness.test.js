import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

test("renders a React component into an isolated jsdom and cleans it up", () => {
  const environment = createDomTestEnvironment();
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);

  try {
    act(() => {
      root.render(React.createElement("button", { type: "button" }, "Open Dataset"));
    });

    const button = environment.document.querySelector('button[type="button"]');
    assert.ok(button);
    assert.equal(button.textContent, "Open Dataset");
  } finally {
    act(() => root.unmount());
    environment.cleanup();
  }
});
