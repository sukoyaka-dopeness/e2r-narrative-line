import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const dataset = {
  version: "1.0",
  entities: [],
  events: [{ id: "event-1", name: "Timeline acquisition fixture" }],
  relations: [],
};

async function createHarness(importResult, fileText = "") {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = "en";
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  let TimelineScreen;
  let LanguageProvider;
  let server;
  try {
    server = await createServer({
      root: process.cwd(),
      server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false },
      appType: "custom",
    });
    ({ TimelineScreen } = await server.ssrLoadModule("/src/screens/TimelineScreen.tsx"));
    ({ LanguageProvider } = await server.ssrLoadModule("/src/i18n/LanguageContext.tsx"));
  } finally {
    await server?.close();
  }

  const imports = [];
  const renderResult = importResult ?? { isValid: true, issues: [] };
  await act(async () => {
    root.render(React.createElement(LanguageProvider, null, React.createElement(TimelineScreen, {
      dataset,
      datasetModified: false,
      selectedEvent: null,
      onSelectEvent: () => {},
      onEditEvent: () => {},
      onAddEvent: () => {},
      onImportDataset: (source) => {
        imports.push(source);
        return renderResult;
      },
      onExportDataset: () => ({ isValid: true, issues: [], json: "{}" }),
      onUpdateDatasetTitle: () => {},
    })));
  });

  const input = container.querySelector('input[type="file"]');
  let pickerRequests = 0;
  input.click = () => { pickerRequests += 1; };

  return {
    environment,
    root,
    container,
    input,
    imports,
    get pickerRequests() { return pickerRequests; },
    fileText: fileText,
    cleanup() {
      act(() => root.unmount());
      environment.cleanup();
    },
  };
}

function openDatasetFromMore(rendered) {
  const more = rendered.container.querySelector('[aria-haspopup="menu"]');
  assert.ok(more);
  act(() => more.click());
  const openItem = [...rendered.container.querySelectorAll('[role="menuitem"]')]
    .find((item) => item.textContent === "Open E2R Dataset");
  assert.ok(openItem);
  act(() => openItem.click());
}

async function dispatchFileChange(rendered, file) {
  Object.defineProperty(rendered.input, "files", {
    configurable: true,
    value: file === null ? [] : [file],
  });
  await act(async () => {
    rendered.input.dispatchEvent(new rendered.environment.window.Event("change", { bubbles: true }));
  });
}

test("Timeline More Open requests the local picker and imports the selected source once", async () => {
  const rendered = await createHarness(null);
  try {
    openDatasetFromMore(rendered);
    assert.equal(rendered.pickerRequests, 1);
    assert.deepEqual(rendered.imports, []);
    assert.equal(rendered.container.querySelector('[role="menu"]'), null);

    const source = JSON.stringify(dataset);
    await dispatchFileChange(rendered, { text: async () => source });
    assert.deepEqual(rendered.imports, [source]);
    assert.equal(rendered.input.value, "");
  } finally {
    await rendered.cleanup();
  }
});

test("Timeline file read failure does not invoke the Dataset import callback", async () => {
  const rendered = await createHarness(null);
  try {
    await dispatchFileChange(rendered, { text: async () => { throw new Error("read failed"); } });
    assert.deepEqual(rendered.imports, []);
    assert.equal(rendered.container.querySelector('[role="alert"]')?.textContent, "The selected file could not be read.");
  } finally {
    await rendered.cleanup();
  }
});

test("Timeline presents returned import issues without parsing or validating locally", async () => {
  const rendered = await createHarness({
    isValid: false,
    issues: [{ code: "json_parse_error", path: "" }],
  });
  try {
    await dispatchFileChange(rendered, { text: async () => "not-json" });
    assert.deepEqual(rendered.imports, ["not-json"]);
    assert.equal(rendered.container.querySelector("#timeline-import-errors-heading")?.textContent, "Import failed");
    assert.equal(rendered.container.textContent.includes("json_parse_error at the document"), true);
  } finally {
    await rendered.cleanup();
  }
});
