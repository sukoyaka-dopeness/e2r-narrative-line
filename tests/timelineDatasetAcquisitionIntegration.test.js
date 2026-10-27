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

async function createHarness(importResult, fileText = "", locale = "en", importWarnings = []) {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = locale;
  environment.window.localStorage.setItem("narrativeline.language", locale);
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
      onMoveEvent: () => ({ ok: false, reason: "unavailable" }),
      onImportDataset: (source) => {
        imports.push(source);
        return renderResult;
      },
      onExportDataset: () => ({ isValid: true, issues: [], json: "{}" }),
      onUpdateDatasetTitle: () => {},
      importWarnings,
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
    const failure = rendered.container.querySelector(".import-failure-notice");
    assert.ok(failure);
    assert.match(failure.textContent, /not readable JSON/);
    assert.match(failure.textContent, /current Dataset was not replaced/);
    assert.match(failure.textContent, /describes the current Dataset, not this failed file/);
    assert.equal(failure.querySelector("details")?.open, false);
    assert.match(failure.querySelector("details")?.textContent ?? "", /json_parse_error/);
    assert.match(failure.querySelector("details")?.textContent ?? "", /Path: "" \(document root\)/);
    assert.equal(rendered.container.querySelectorAll(".import-information").length, 0);
  } finally {
    await rendered.cleanup();
  }
});

test("failed JA import stays distinct from existing Current warnings and retains technical cause", async () => {
  const rendered = await createHarness(
    { isValid: false, issues: [{ code: "json_parse_error", path: "" }] },
    "",
    "ja",
    [{ code: "unknown_extension", severity: "warning", path: "/extensions/experimental.current" }],
  );
  try {
    await dispatchFileChange(rendered, { text: async () => "not-json" });
    const failure = rendered.container.querySelector(".import-failure-notice");
    const current = rendered.container.querySelector(".import-information");
    assert.ok(failure && current);
    assert.match(failure.textContent, /JSONとして読み取れませんでした/);
    assert.match(failure.textContent, /現在のDatasetは置き換えられていません/);
    assert.match(failure.textContent, /今回失敗したファイルの診断ではありません/);
    assert.doesNotMatch(failure.textContent, /unknown_extension/);
    assert.match(failure.querySelector("details")?.textContent ?? "", /json_parse_error/);
    assert.match(current.querySelector("details")?.textContent ?? "", /unknown_extension/);
    assert.ok(failure.compareDocumentPosition(current) & rendered.environment.window.Node.DOCUMENT_POSITION_FOLLOWING);
  } finally {
    await rendered.cleanup();
  }
});

test("structural import failure explains validation and keeps all exact issues in details", async () => {
  const rendered = await createHarness({
    isValid: false,
    issues: [
      { code: "version_missing", severity: "error", path: "/version" },
      { code: "event_invalid", severity: "error", path: "/events/0", relatedIds: ["event-1"] },
    ],
  });
  try {
    await dispatchFileChange(rendered, { text: async () => "{}" });
    const failure = rendered.container.querySelector(".import-failure-notice");
    assert.ok(failure);
    assert.match(failure.textContent, /did not pass E2R Dataset validation/);
    assert.match(failure.textContent, /check its content and format/i);
    assert.match(failure.querySelector("details")?.textContent ?? "", /version_missing.*\/version/s);
    assert.match(failure.querySelector("details")?.textContent ?? "", /event_invalid.*\/events\/0.*event-1/s);
    assert.equal(failure.querySelectorAll("details li").length, 2);
  } finally {
    await rendered.cleanup();
  }
});
