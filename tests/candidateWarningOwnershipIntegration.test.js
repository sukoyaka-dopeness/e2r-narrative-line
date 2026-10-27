import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

function dataset(id, extension) {
  return {
    version: "1.0",
    entities: [],
    events: [{ id, name: `Dataset ${id}` }],
    relations: [],
    ...(extension ? { extensions: { [`experimental.${extension}`]: { retained: true } } } : {}),
  };
}

async function renderApp({ current = dataset("a"), hash = "", locale = "en", fetchReplacement, peerBlocked = false } = {}) {
  const environment = createDomTestEnvironment(`https://n4-isolated.test/${hash}`);
  environment.document.documentElement.lang = locale;
  environment.window.localStorage.setItem("narrativeline.language", locale);
  if (current) environment.window.localStorage.setItem("narrativeline.lastDataset", JSON.stringify(current));
  let releasePeer;
  if (peerBlocked) {
    const key = "e2r:narrativeline:workspace-tab:peer-tab";
    environment.window.localStorage.setItem(key, JSON.stringify({ tabId: "peer-tab", active: true }));
    let acquired;
    const acquiredPromise = new Promise((resolve) => { acquired = resolve; });
    const heldPromise = new Promise((resolve) => { releasePeer = resolve; });
    void environment.window.navigator.locks.request(key, async () => { acquired(); await heldPromise; });
    await acquiredPromise;
  }
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};
  environment.window.requestAnimationFrame = (callback) => { callback(0); return 0; };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.scrollTo = () => {};
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  if (fetchReplacement) Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: fetchReplacement });
  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false, port: 0, strictPort: false }, appType: "custom" });
  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await server.close();
    let mountNumber = 0;
    const mount = async () => {
      await act(async () => root.render(React.createElement(LanguageProvider, { key: ++mountNumber }, React.createElement(App))));
      await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    };
    await mount();
    return {
      container,
      environment,
      remount: mount,
      async cleanup() {
        releasePeer?.();
        await act(async () => root.unmount());
        environment.cleanup();
        if (originalFetch) Object.defineProperty(globalThis, "fetch", originalFetch);
        else delete globalThis.fetch;
      },
    };
  } catch (error) {
    releasePeer?.();
    await act(async () => root.unmount());
    environment.cleanup();
    await server.close();
    if (originalFetch) Object.defineProperty(globalThis, "fetch", originalFetch);
    else delete globalThis.fetch;
    throw error;
  }
}

async function click(container, selector) {
  const button = container.querySelector(selector);
  assert.ok(button, selector);
  await act(async () => button.click());
}

async function importFile(rendered, value) {
  const input = rendered.container.querySelector('input[type="file"]');
  assert.ok(input);
  Object.defineProperty(input, "files", { configurable: true, value: [{ text: async () => JSON.stringify(value) }] });
  await act(async () => input.dispatchEvent(new rendered.environment.window.Event("change", { bubbles: true })));
}

async function markCurrentDirty(rendered, label) {
  const title = rendered.container.querySelector("#dataset-title-input");
  assert.ok(title);
  await act(async () => {
    Object.getOwnPropertyDescriptor(rendered.environment.window.HTMLInputElement.prototype, "value").set.call(title, label);
    title.dispatchEvent(new rendered.environment.window.Event("input", { bubbles: true }));
    title.dispatchEvent(new rendered.environment.window.Event("change", { bubbles: true }));
  });
  await click(rendered.container, ".dataset-title-editor button");
  assert.equal(rendered.container.querySelector(".timeline-screen").dataset.datasetModified, "true");
}

function currentWarningText(container) {
  return container.querySelector(".import-information")?.textContent ?? "";
}

test("candidate warnings stay out of Current Dataset on Cancel and transfer only on successful guarded Accept", async () => {
  const rendered = await renderApp();
  try {
    await click(rendered.container, ".home-actions button");
    await importFile(rendered, dataset("a2", "current"));
    assert.match(currentWarningText(rendered.container), /experimental\.current/);
    await markCurrentDirty(rendered, "Current A edits");

    await importFile(rendered, dataset("b", "candidate"));
    const dialog = rendered.container.querySelector(".dataset-replacement-dialog");
    assert.ok(dialog);
    assert.match(dialog.textContent, /experimental\.candidate/);
    assert.match(currentWarningText(rendered.container), /experimental\.current/);
    assert.doesNotMatch(currentWarningText(rendered.container), /experimental\.candidate/);
    await click(rendered.container, ".replacement-cancel");
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.match(currentWarningText(rendered.container), /experimental\.current/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "a2");

    await importFile(rendered, dataset("b", "candidate"));
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.match(currentWarningText(rendered.container), /experimental\.candidate/);
    assert.doesNotMatch(currentWarningText(rendered.container), /experimental\.current/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "b");

    await markCurrentDirty(rendered, "Current B edits");
    await importFile(rendered, dataset("c"));
    assert.equal(rendered.container.querySelector(".replacement-candidate-warnings"), null);
    assert.match(currentWarningText(rendered.container), /experimental\.candidate/);
    await click(rendered.container, ".replacement-cancel");
    assert.match(currentWarningText(rendered.container), /experimental\.candidate/);
    await importFile(rendered, dataset("c"));
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    assert.equal(currentWarningText(rendered.container), "");
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "c");
  } finally {
    await rendered.cleanup();
  }
});

test("warning-bearing Home import uses the accepted Dataset, not an abandoned candidate", async () => {
  const rendered = await renderApp();
  try {
    await importFile(rendered, dataset("home", "home"));
    assert.ok(rendered.container.querySelector(".timeline-screen"));
    assert.match(currentWarningText(rendered.container), /experimental\.home/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "home");
  } finally {
    await rendered.cleanup();
  }
});

test("Japanese replacement warning states Candidate ownership", async () => {
  const rendered = await renderApp({ locale: "ja" });
  try {
    await click(rendered.container, ".home-actions button");
    await markCurrentDirty(rendered, "編集中のDataset");
    await importFile(rendered, dataset("b", "candidate"));
    const notice = rendered.container.querySelector(".dataset-replacement-dialog .replacement-candidate-warnings");
    assert.ok(notice);
    assert.match(notice.textContent, /置き換え候補/);
    assert.match(notice.textContent, /現在のDatasetではなく/);
    assert.match(notice.textContent, /experimental\.candidate/);
  } finally {
    await rendered.cleanup();
  }
});

test("Candidate and Current diagnostics use plain summaries and one expandable technical list", async () => {
  const rendered = await renderApp({ current: dataset("a", "current"), locale: "ja" });
  try {
    await click(rendered.container, ".home-actions button");
    const current = rendered.container.querySelector(".import-information");
    assert.ok(current);
    assert.doesNotMatch(current.querySelector(":scope > ul")?.textContent ?? "", /unknown_extension|specification_unavailable|\/extensions\//);
    const currentDetails = current.querySelector(".import-warning-details");
    assert.ok(currentDetails);
    assert.equal(currentDetails.open, false);
    assert.match(currentDetails.textContent, /unknown_extension/);
    assert.match(currentDetails.textContent, /Path: \/extensions\//);
    assert.match(currentDetails.textContent, /warning/);

    await markCurrentDirty(rendered, "現在の編集");
    await importFile(rendered, dataset("b", "candidate"));
    const candidate = rendered.container.querySelector(".replacement-candidate-warnings");
    assert.ok(candidate);
    assert.doesNotMatch(candidate.querySelectorAll(":scope > p")[1]?.textContent ?? "", /unknown_extension|\/extensions\//);
    const candidateDetails = candidate.querySelector(".import-warning-details");
    assert.ok(candidateDetails);
    assert.equal(candidateDetails.open, false);
    assert.match(candidateDetails.textContent, /unknown_extension/);
    assert.match(candidateDetails.textContent, /Path: \/extensions\//);
    await act(async () => { candidateDetails.open = true; });
    assert.equal(candidateDetails.open, true);
    assert.match(current.querySelector(".import-warning-details")?.textContent ?? "", /experimental\.current/);
    assert.doesNotMatch(current.querySelector(".import-warning-details")?.textContent ?? "", /experimental\.candidate/);
    await click(rendered.container, ".dataset-replacement-dialog .replacement-cancel");
    assert.equal(rendered.container.querySelector(".replacement-candidate-warnings"), null);
    assert.match(rendered.container.querySelector(".import-information .import-warning-details")?.textContent ?? "", /experimental\.current/);
  } finally {
    await rendered.cleanup();
  }
});

test("English candidate explanation does not present unknown Extensions as a broken Dataset", async () => {
  const rendered = await renderApp({ locale: "en" });
  try {
    await click(rendered.container, ".home-actions button");
    await markCurrentDirty(rendered, "Current edits");
    await importFile(rendered, dataset("b", "candidate"));
    const candidate = rendered.container.querySelector(".replacement-candidate-warnings");
    assert.ok(candidate);
    assert.match(candidate.querySelectorAll(":scope > p")[1]?.textContent ?? "", /contains Extension information this app cannot fully inspect/);
    assert.match(candidate.querySelectorAll(":scope > p")[1]?.textContent ?? "", /not guaranteed/);
    assert.match(candidate.querySelector("summary")?.textContent ?? "", /Diagnostic details/);
    assert.match(candidate.querySelector(".import-warning-details")?.textContent ?? "", /unknown_extension/);
  } finally {
    await rendered.cleanup();
  }
});

test("Export and Continue retains accepted Candidate warnings", async () => {
  const rendered = await renderApp();
  const createObjectURL = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
  const revokeObjectURL = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
  const anchorClick = Object.getOwnPropertyDescriptor(rendered.environment.window.HTMLAnchorElement.prototype, "click");
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: () => "blob:n4-isolated" });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => {} });
  Object.defineProperty(rendered.environment.window.HTMLAnchorElement.prototype, "click", { configurable: true, value: () => {} });
  try {
    await click(rendered.container, ".home-actions button");
    await markCurrentDirty(rendered, "Current A edits");
    await importFile(rendered, dataset("b", "export-continue"));
    const exportButton = [...rendered.container.querySelectorAll(".dataset-replacement-dialog button")]
      .find((button) => button.textContent === "Export and Continue");
    assert.ok(exportButton);
    await act(async () => exportButton.click());
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.match(currentWarningText(rendered.container), /experimental\.export-continue/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "b");
  } finally {
    if (createObjectURL) Object.defineProperty(URL, "createObjectURL", createObjectURL);
    else delete URL.createObjectURL;
    if (revokeObjectURL) Object.defineProperty(URL, "revokeObjectURL", revokeObjectURL);
    else delete URL.revokeObjectURL;
    if (anchorClick) Object.defineProperty(rendered.environment.window.HTMLAnchorElement.prototype, "click", anchorClick);
    await rendered.cleanup();
  }
});

test("warning-bearing Handoff with a restored Dataset waits for explicit acceptance", async () => {
  const url = "https://fixture.invalid/warning-handoff.e2r.json";
  const rendered = await renderApp({
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async (actual) => {
      assert.equal(actual, url);
      return { ok: true, text: async () => JSON.stringify(dataset("handoff", "handoff")) };
    },
  });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    assert.match(rendered.container.querySelector(".dataset-replacement-dialog")?.textContent ?? "", /saved in this browser/);
    assert.match(rendered.container.querySelector(".dataset-replacement-dialog .replacement-candidate-warnings")?.textContent ?? "", /experimental\.handoff/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "a");
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.match(currentWarningText(rendered.container), /experimental\.handoff/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "handoff");
  } finally {
    await rendered.cleanup();
  }
});

test("accepted Handoff reload resumes the same saved Dataset without replacing saved edits", async () => {
  const url = "https://fixture.invalid/accepted-reload.e2r.json";
  let remote = dataset("cedar", "known-candidate");
  const rendered = await renderApp({
    current: dataset("prior"),
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({ ok: true, text: async () => JSON.stringify(remote) }),
  });
  try {
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.match(currentWarningText(rendered.container), /experimental\.known-candidate/);
    await rendered.remount();
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.ok(rendered.container.querySelector(".timeline-screen"));
    assert.match(currentWarningText(rendered.container), /experimental\.known-candidate/);

    await markCurrentDirty(rendered, "Saved Cedar edit");
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.match(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), /Saved Cedar edit/);
    await rendered.remount();
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(rendered.container.querySelector("#dataset-title-input")?.value, "Saved Cedar edit");
    assert.match(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), /Saved Cedar edit/);

    remote = dataset("changed", "changed-candidate");
    await rendered.remount();
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    assert.match(rendered.container.querySelector(".replacement-candidate-warnings")?.textContent ?? "", /experimental\.changed-candidate/);
    assert.match(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), /Saved Cedar edit/);
    await click(rendered.container, ".dataset-replacement-dialog .replacement-cancel");
    assert.match(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), /Saved Cedar edit/);
  } finally {
    await rendered.cleanup();
  }
});

test("new Handoff URL and failed acquisition do not reuse an earlier acceptance", async () => {
  const originalUrl = "https://fixture.invalid/first.e2r.json";
  const nextUrl = "https://fixture.invalid/next.e2r.json";
  let fetchFails = false;
  const rendered = await renderApp({
    current: dataset("prior"),
    hash: `#locale=en&datasetUrl=${encodeURIComponent(originalUrl)}`,
    fetchReplacement: async () => fetchFails
      ? { ok: false, text: async () => "" }
      : { ok: true, text: async () => JSON.stringify(dataset("accepted", "candidate")) },
  });
  try {
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    const acceptedRaw = rendered.environment.window.localStorage.getItem("narrativeline.lastDataset");
    rendered.environment.window.history.replaceState(null, "", `#locale=en&datasetUrl=${encodeURIComponent(nextUrl)}`);
    await rendered.remount();
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    assert.equal(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), acceptedRaw);
    await click(rendered.container, ".dataset-replacement-dialog .replacement-cancel");
    fetchFails = true;
    await rendered.remount();
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), acceptedRaw);
    assert.match(rendered.container.textContent, /Could not retrieve the Dataset/);
  } finally {
    await rendered.cleanup();
  }
});

test("missing tab recognition and history navigation keep the saved Dataset guarded", async () => {
  const url = "https://fixture.invalid/history-reload.e2r.json";
  const rendered = await renderApp({
    current: dataset("prior"),
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({ ok: true, text: async () => JSON.stringify(dataset("accepted", "candidate")) }),
  });
  try {
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    const saved = rendered.environment.window.localStorage.getItem("narrativeline.lastDataset");
    rendered.environment.window.history.replaceState(null, "", "#locale=en");
    await rendered.remount();
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), saved);

    rendered.environment.window.sessionStorage.clear();
    rendered.environment.window.history.replaceState(null, "", `#locale=en&datasetUrl=${encodeURIComponent(url)}`);
    await rendered.remount();
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    assert.equal(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), saved);
    await click(rendered.container, ".dataset-replacement-dialog .replacement-cancel");
    assert.equal(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), saved);
  } finally {
    await rendered.cleanup();
  }
});

test("canceling a different Handoff preserves recognition of the accepted URL on history return", async () => {
  const jaUrl = "https://fixture.invalid/cedar-ja.e2r.json";
  const enUrl = "https://fixture.invalid/cedar-en.e2r.json";
  const jaHash = `#locale=ja&datasetUrl=${encodeURIComponent(jaUrl)}`;
  const rendered = await renderApp({
    current: dataset("prior"),
    hash: jaHash,
    locale: "ja",
    fetchReplacement: async (url) => ({
      ok: true,
      text: async () => JSON.stringify(url === jaUrl ? dataset("cedar-ja", "ja") : dataset("cedar-en", "en")),
    }),
  });
  try {
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    await markCurrentDirty(rendered, "F2 JA EDITED - KEEP");
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    const savedJa = rendered.environment.window.localStorage.getItem("narrativeline.lastDataset");
    assert.match(savedJa, /F2 JA EDITED - KEEP/);
    const recognitionKey = "narrativeline.acceptedHandoffRecognition.v1";
    const recognizedJa = rendered.environment.window.sessionStorage.getItem(recognitionKey);
    assert.match(recognizedJa, /cedar-ja/);

    await rendered.remount();
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    rendered.environment.window.history.replaceState(null, "", `#locale=ja&datasetUrl=${encodeURIComponent(enUrl)}`);
    await rendered.remount();
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    await click(rendered.container, ".dataset-replacement-dialog .replacement-cancel");
    assert.equal(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), savedJa);
    assert.equal(rendered.environment.window.sessionStorage.getItem(recognitionKey), recognizedJa);

    rendered.environment.window.history.replaceState(null, "", jaHash);
    await rendered.remount();
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.match(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), /F2 JA EDITED - KEEP/);
  } finally {
    await rendered.cleanup();
  }
});

test("peer-refused Handoff keeps Candidate warnings separate and Cancel protects Current Dataset", async () => {
  const url = "https://fixture.invalid/refused-warning-handoff.e2r.json";
  const rendered = await renderApp({
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    peerBlocked: true,
    fetchReplacement: async (actual) => {
      assert.equal(actual, url);
      return { ok: true, text: async () => JSON.stringify(dataset("refused", "candidate")) };
    },
  });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    await click(rendered.container, ".dataset-replacement-dialog .button-danger");
    assert.match(rendered.container.querySelector('[role="alert"]')?.textContent ?? "", /another .* tab|workspace|safety/i);
    assert.match(rendered.container.querySelector(".dataset-replacement-dialog .replacement-candidate-warnings")?.textContent ?? "", /experimental\.candidate/);
    assert.equal(currentWarningText(rendered.container), "");
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "a");
    await click(rendered.container, ".dataset-replacement-dialog .replacement-cancel");
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "a");
  } finally {
    await rendered.cleanup();
  }
});

test("restored unexported Dataset and its warnings survive Handoff Cancel", async () => {
  const current = dataset("restored", "current");
  current.events[0].name = "Unexported browser edit";
  const url = "https://fixture.invalid/other-dataset.e2r.json";
  const rendered = await renderApp({
    current,
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({ ok: true, text: async () => JSON.stringify(dataset("candidate", "candidate")) }),
  });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.match(rendered.container.querySelector(".dataset-replacement-dialog")?.textContent ?? "", /experimental\.candidate/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].name, "Unexported browser edit");
    await click(rendered.container, ".dataset-replacement-dialog .replacement-cancel");
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].name, "Unexported browser edit");
    await click(rendered.container, ".home-actions > button");
    assert.match(currentWarningText(rendered.container), /experimental\.current/);
    assert.doesNotMatch(currentWarningText(rendered.container), /experimental\.candidate/);
  } finally {
    await rendered.cleanup();
  }
});

test("Handoff into an empty browser remains direct", async () => {
  const url = "https://fixture.invalid/first-dataset.e2r.json";
  const rendered = await renderApp({
    current: null,
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({ ok: true, text: async () => JSON.stringify(dataset("first", "first")) }),
  });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "first");
    assert.match(currentWarningText(rendered.container), /experimental\.first/);
  } finally {
    await rendered.cleanup();
  }
});

test("restored Dataset Export and Continue exports A before accepting Handoff B", async () => {
  const current = dataset("restored", "current");
  current.events[0].name = "Unexported title";
  const url = "https://fixture.invalid/export-handoff.e2r.json";
  const rendered = await renderApp({
    current,
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({ ok: true, text: async () => JSON.stringify(dataset("replacement", "candidate")) }),
  });
  const createObjectURL = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
  const revokeObjectURL = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
  const anchorClick = Object.getOwnPropertyDescriptor(rendered.environment.window.HTMLAnchorElement.prototype, "click");
  let exportedBlob;
  let clicked = false;
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: (blob) => { exportedBlob = blob; return "blob:n4-restored"; } });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => {} });
  Object.defineProperty(rendered.environment.window.HTMLAnchorElement.prototype, "click", { configurable: true, value: () => { clicked = true; } });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    const button = [...rendered.container.querySelectorAll(".dataset-replacement-dialog button")]
      .find((element) => element.textContent === "Export and Continue");
    assert.ok(button);
    await act(async () => button.click());
    assert.equal(clicked, true);
    assert.equal(JSON.parse(await exportedBlob.text()).events[0].name, "Unexported title");
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "replacement");
    assert.match(currentWarningText(rendered.container), /experimental\.candidate/);
  } finally {
    if (createObjectURL) Object.defineProperty(URL, "createObjectURL", createObjectURL);
    else delete URL.createObjectURL;
    if (revokeObjectURL) Object.defineProperty(URL, "revokeObjectURL", revokeObjectURL);
    else delete URL.revokeObjectURL;
    if (anchorClick) Object.defineProperty(rendered.environment.window.HTMLAnchorElement.prototype, "click", anchorClick);
    await rendered.cleanup();
  }
});

test("same-content startup Handoff still requires a decision", async () => {
  const current = dataset("same", "current");
  const url = "https://fixture.invalid/same-dataset.e2r.json";
  const rendered = await renderApp({
    current,
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({ ok: true, text: async () => JSON.stringify(current) }),
  });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.ok(rendered.container.querySelector(".dataset-replacement-dialog"));
    assert.equal(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset"), JSON.stringify(current));
  } finally {
    await rendered.cleanup();
  }
});

test("failed startup Handoff keeps restored Dataset", async () => {
  const current = dataset("kept", "current");
  const url = "https://fixture.invalid/missing-dataset.e2r.json";
  const rendered = await renderApp({
    current,
    hash: `#locale=en&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({ ok: false }),
  });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.match(rendered.container.textContent, /Could not retrieve the Dataset/);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "kept");
  } finally {
    await rendered.cleanup();
  }
});

test("warning-bearing replacement traps focus and locks background scroll until Escape", async () => {
  const url = "https://fixture.invalid/long-warning-handoff.e2r.json";
  const rendered = await renderApp({
    current: dataset("kept", "current"),
    locale: "ja",
    hash: `#locale=ja&datasetUrl=${encodeURIComponent(url)}`,
    fetchReplacement: async () => ({
      ok: true,
      text: async () => JSON.stringify(dataset("candidate", "candidate-with-a-very-long-extension-identifier")),
    }),
  });
  try {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    const dialog = rendered.container.querySelector(".dataset-replacement-dialog");
    assert.ok(dialog);
    const summary = dialog.querySelector(".replacement-candidate-warnings summary");
    const details = summary?.closest("details");
    assert.ok(summary);
    assert.ok(details);
    assert.equal(details.open, false);
    const buttons = [...dialog.querySelectorAll("button")];
    assert.equal(buttons.length, 3);
    assert.equal(rendered.environment.document.documentElement.style.overflowY, "hidden");
    assert.equal(rendered.environment.document.body.style.overflowY, "hidden");
    assert.equal(rendered.environment.document.activeElement, buttons[0]);
    await act(async () => {
      buttons[2].focus();
      buttons[2].dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    });
    assert.equal(rendered.environment.document.activeElement, summary);
    const focusOrder = [...dialog.querySelectorAll("summary, button")];
    assert.deepEqual(focusOrder, [summary, ...buttons]);
    await act(async () => summary.focus());
    assert.equal(rendered.environment.document.activeElement, summary);
    for (const key of ["Enter", " "]) {
      const activation = new rendered.environment.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      summary.dispatchEvent(activation);
      assert.equal(activation.defaultPrevented, false);
    }
    await act(async () => {
      details.open = true;
      summary.focus();
      summary.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    });
    assert.equal(details.open, true);
    assert.equal(rendered.environment.document.activeElement, buttons[2]);
    // Clicking non-focusable dialog copy can leave body as the active element.
    await act(async () => {
      buttons[2].blur();
      rendered.environment.document.body.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    });
    assert.equal(rendered.environment.document.activeElement, buttons[2]);
    await act(async () => {
      buttons[2].blur();
      rendered.environment.document.body.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    });
    assert.equal(rendered.environment.document.activeElement, summary);
    await act(async () => {
      dialog.focus();
      dialog.querySelector("p").dispatchEvent(new rendered.environment.window.MouseEvent("click", { bubbles: true }));
      dialog.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Shift", shiftKey: true, bubbles: true, cancelable: true }));
    });
    assert.equal(rendered.environment.document.activeElement, dialog);
    await act(async () => {
      dialog.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    });
    assert.equal(rendered.environment.document.activeElement, buttons[2]);
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "kept");
    await act(async () => {
      buttons[2].blur();
      rendered.environment.document.body.dispatchEvent(new rendered.environment.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    assert.equal(rendered.container.querySelector(".dataset-replacement-dialog"), null);
    assert.equal(rendered.environment.document.documentElement.style.overflowY, "");
    assert.equal(rendered.environment.document.body.style.overflowY, "");
    assert.equal(JSON.parse(rendered.environment.window.localStorage.getItem("narrativeline.lastDataset")).events[0].id, "kept");
  } finally {
    await rendered.cleanup();
  }
});

test("Candidate dialog omits container focus decoration while action buttons keep their focus ring", async () => {
  const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
  const containerFocusRule = css.match(/\.dataset-replacement-dialog:focus-visible\s*\{([^}]*)\}/)?.[1];
  assert.ok(containerFocusRule);
  assert.match(containerFocusRule, /outline: none;/);
  assert.doesNotMatch(containerFocusRule, /box-shadow|border/);
  assert.match(css, /\.modal-actions button:focus\s*\{[^}]*outline: 3px solid var\(--accent\);/s);
});
