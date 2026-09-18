import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const candidateDataset = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [{
    id: "event-candidate",
    name: "Candidate Event",
    extensions: {
      history: {
        assertions: [{
          id: "position-1",
          type: "position",
          position: { year: 1969, month: 7, day: 20 },
        }],
      },
    },
  }],
  relations: [],
  extensions: {
    "draft.github.sukoyaka-dopeness.specification": {
      specVersion: "0.1.0",
      uses: [{ extension: "history", version: "2.0.0" }],
    },
  },
});

function buttonByText(document, text) {
  return [...document.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === text,
  );
}

async function renderCandidateApp(language) {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = language;
  environment.window.localStorage.setItem("narrativeline.language", language);
  environment.window.localStorage.setItem("narrativeline.lastDataset", candidateDataset);
  environment.window.requestAnimationFrame = (callback) => {
    callback(0);
    return 0;
  };
  environment.window.cancelAnimationFrame = () => {};
  environment.window.scrollTo = () => {};
  environment.window.HTMLElement.prototype.scrollIntoView = () => {};

  const container = environment.document.createElement("div");
  environment.document.body.append(container);
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);
  const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, port: 0, strictPort: false },
    appType: "custom",
  });

  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([
      server.ssrLoadModule("/src/App.tsx"),
      server.ssrLoadModule("/src/i18n/LanguageContext.tsx"),
    ]);
    await act(async () => {
      root.render(React.createElement(LanguageProvider, null, React.createElement(App)));
    });
  } finally {
    await server.close();
  }

  return {
    ...environment,
    cleanup() {
      act(() => root.unmount());
      environment.cleanup();
    },
  };
}

function openCandidateEvent(document) {
  const resume = document.querySelector(".home-actions button");
  assert.ok(resume);
  act(() => resume.click());

  const card = [...document.querySelectorAll(".timeline-card")].find(
    (item) => item.textContent?.includes("Candidate Event"),
  );
  assert.ok(card);
  act(() => card.dispatchEvent(new document.defaultView.MouseEvent("click", { bubbles: true })));

  const edit = document.querySelector(".timeline-card button");
  assert.ok(edit);
  act(() => edit.click());
}

test("History 2 Candidate Event Detail is read-only in English and preserves unrelated editing", async () => {
  const rendered = await renderCandidateApp("en");
  try {
    openCandidateEvent(rendered.document);
    assert.ok(rendered.document.querySelector(".history-read-only-notice"));
    assert.equal(rendered.document.querySelectorAll('input[type="number"]').length, 0);
    assert.equal(rendered.document.querySelector(".event-time-fields"), null);

    const name = rendered.document.querySelector('input[placeholder="Enter event name"]');
    assert.ok(name);
    const valueSetter = Object.getOwnPropertyDescriptor(
      rendered.window.HTMLInputElement.prototype,
      "value",
    )?.set;
    assert.ok(valueSetter);
    act(() => {
      valueSetter.call(name, "Edited Candidate Event");
      name.dispatchEvent(new rendered.window.Event("input", { bubbles: true }));
      name.dispatchEvent(new rendered.window.Event("change", { bubbles: true }));
    });
    const save = buttonByText(rendered.document, "Save Event");
    assert.ok(save);
    act(() => save.click());
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.ok(rendered.document.body.textContent.includes("Edited Candidate Event"));
  } finally {
    rendered.cleanup();
  }
});

test("History 2 Candidate Event Detail presents the read-only notice in Japanese", async () => {
  const rendered = await renderCandidateApp("ja");
  try {
    openCandidateEvent(rendered.document);
    assert.ok(rendered.document.body.textContent.includes("このHistoryデータは現在NarrativeLineで読み取り専用です"));
    assert.equal(rendered.document.querySelectorAll('input[type="number"]').length, 0);
  } finally {
    rendered.cleanup();
  }
});
