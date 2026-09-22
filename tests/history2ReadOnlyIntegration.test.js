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

const stableDataset = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [{
    id: "event-stable",
    name: "Stable Event",
    extensions: { history: { time: { year: 1900 } } },
  }],
  relations: [],
  extensions: {
    metadata: { datasetId: "dataset-stable" },
  },
});

const newDatasetWithoutHistory = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [{ id: "event-new", name: "New Event" }],
  relations: [],
  extensions: { metadata: { datasetId: "dataset-new" } },
});

const unsafeDataset = JSON.stringify({
  version: "1.0",
  entities: [],
  events: [
    {
      id: "event-unsafe",
      name: "Unsafe Event",
      extensions: { history: { time: { year: 1899, future: true } } },
    },
    {
      id: "event-target",
      name: "Target Event",
      extensions: { history: { time: { year: 1900 } } },
    },
  ],
  relations: [],
  extensions: {
    metadata: { datasetId: "dataset-unsafe" },
  },
});

function buttonByText(document, text) {
  return [...document.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === text,
  );
}

async function renderCandidateApp(language, datasetSource = candidateDataset) {
  const environment = createDomTestEnvironment("https://narrativeline.test/");
  environment.document.documentElement.lang = language;
  environment.window.localStorage.setItem("narrativeline.language", language);
  environment.window.localStorage.setItem("narrativeline.lastDataset", datasetSource);
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

function openCandidateEvent(document, eventName = "Candidate Event") {
  const resume = document.querySelector(".home-actions button");
  assert.ok(resume);
  act(() => resume.click());

  const card = [...document.querySelectorAll(".timeline-card")].find(
    (item) => item.textContent?.includes(eventName),
  );
  assert.ok(card);
  act(() => card.dispatchEvent(new document.defaultView.MouseEvent("click", { bubbles: true })));

  const edit = document.querySelector(".timeline-card button");
  assert.ok(edit);
  act(() => edit.click());
}

test("History 2 single-position Candidate Event is editable and preserves unrelated editing", async () => {
  const rendered = await renderCandidateApp("en");
  try {
    openCandidateEvent(rendered.document);
    assert.equal(rendered.document.querySelector(".history-read-only-notice"), null);
    assert.equal(rendered.document.querySelectorAll('input[type="number"]').length, 6);
    assert.equal(rendered.document.querySelectorAll('input[type="checkbox"]').length, 1);
    assert.match(
      rendered.document.querySelector(".history-approximation-toggle")?.textContent ?? "",
      /date and time/,
    );
    const timeFields = rendered.document.querySelector(".event-time-fields");
    const approximationToggle = rendered.document.querySelector(".history-approximation-toggle");
    assert.ok(timeFields);
    assert.ok(approximationToggle);
    assert.equal(timeFields.compareDocumentPosition(approximationToggle) & 4, 4);

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

test("History 2 single-position Candidate Event presents approximation control in Japanese", async () => {
  const rendered = await renderCandidateApp("ja");
  try {
    openCandidateEvent(rendered.document);
    assert.equal(rendered.document.querySelectorAll('input[type="number"]').length, 6);
    assert.equal(rendered.document.querySelectorAll('input[type="checkbox"]').length, 1);
    assert.match(
      rendered.document.querySelector(".history-approximation-toggle")?.textContent ?? "",
      /日付と時刻/,
    );
  } finally {
    rendered.cleanup();
  }
});

test("real Event Detail save upgrades a Stable History Event to H2 circa", async () => {
  const rendered = await renderCandidateApp("en", stableDataset);
  try {
    openCandidateEvent(rendered.document, "Stable Event");
    const approximation = rendered.document.querySelector('input[type="checkbox"]');
    assert.ok(approximation);
    act(() => approximation.click());
    assert.match(
      rendered.document.querySelector(".history-approximation-notice")?.textContent ?? "",
      /entered date and time/,
    );

    const save = buttonByText(rendered.document, "Save Event");
    assert.ok(save);
    act(() => save.click());

    const confirm = buttonByText(rendered.document, "Save as approximate");
    assert.ok(confirm);
    const dialog = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(dialog);
    assert.equal(dialog.querySelector("h2")?.textContent, "Record this date and time as approximate?");
    assert.equal(
      dialog.querySelector("p")?.textContent,
      "Saving this change will update compatible recorded dates and times in this Dataset to the History 2 representation. Their meaning and precision will be preserved; no precise date/time range will be inferred. Canceling leaves the Dataset unchanged.",
    );
    assert.ok(dialog.querySelector(".history-upgrade-actions"));
    assert.equal(dialog.querySelector(".history-upgrade-actions")?.children[0]?.textContent, "Cancel");
    assert.match(
      rendered.document.body.textContent ?? "",
      /compatible recorded dates/,
    );
    act(() => confirm.click());

    assert.ok(rendered.document.querySelector(".timeline-screen"));
    assert.ok(rendered.document.body.textContent.includes("circa 1900"));
  } finally {
    rendered.cleanup();
  }
});

test("new Dataset initializes H2 circa without Dataset-wide migration confirmation", async () => {
  const rendered = await renderCandidateApp("en", newDatasetWithoutHistory);
  try {
    openCandidateEvent(rendered.document, "New Event");
    const year = rendered.document.querySelector('input[type="number"]');
    const approximation = rendered.document.querySelector('input[type="checkbox"]');
    assert.ok(year);
    assert.ok(approximation);
    const valueSetter = Object.getOwnPropertyDescriptor(
      rendered.window.HTMLInputElement.prototype,
      "value",
    )?.set;
    assert.ok(valueSetter);
    act(() => {
      valueSetter.call(year, "1989");
      year.dispatchEvent(new rendered.window.Event("input", { bubbles: true }));
      year.dispatchEvent(new rendered.window.Event("change", { bubbles: true }));
      approximation.click();
    });

    const save = buttonByText(rendered.document, "Save Event");
    assert.ok(save);
    act(() => save.click());

    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.ok(rendered.document.querySelector(".timeline-screen"));
    const persisted = JSON.parse(rendered.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.deepEqual(persisted.events[0].extensions.history.assertions[0].position, {
      year: 1989,
      approximation: "circa",
    });
    assert.deepEqual(
      persisted.extensions["draft.github.sukoyaka-dopeness.specification"].uses,
      [
        { extension: "metadata", version: "1.0.0" },
        { extension: "history", version: "2.0.0", features: ["approximation"] },
      ],
    );
  } finally {
    rendered.cleanup();
  }
});

for (const [language, refusalCopy] of [
  ["en", "This Dataset contains History data that cannot be safely upgraded to History 2. No changes were saved."],
  ["ja", "このDatasetには安全にHistory 2形式へ更新できないHistoryデータが含まれています。変更は保存されませんでした。"],
]) {
  test(`unsafe Dataset refusal stays in Event Detail with ${language} feedback`, async () => {
    const rendered = await renderCandidateApp(language, unsafeDataset);
    try {
      openCandidateEvent(rendered.document, "Target Event");
      const approximation = rendered.document.querySelector('input[type="checkbox"]');
      assert.ok(approximation);
      act(() => approximation.click());

      const save = buttonByText(rendered.document, language === "ja" ? "できごとを保存" : "Save Event");
      assert.ok(save);
      act(() => save.click());

      assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
      assert.equal(rendered.document.querySelector('[role="alert"]')?.textContent, refusalCopy);
      assert.ok(rendered.document.querySelector(".detail-screen--event"));
      assert.equal(rendered.document.querySelector(".timeline-screen"), null);
      assert.equal(approximation.checked, true);

      const persisted = JSON.parse(rendered.window.localStorage.getItem("narrativeline.lastDataset"));
      assert.equal(persisted.events[0].extensions.history.time.future, true);
      assert.deepEqual(persisted.events[0].extensions.history, {
        time: { year: 1899, future: true },
      });
      assert.deepEqual(persisted.events[1].extensions.history, { time: { year: 1900 } });
      assert.equal(persisted.extensions["draft.github.sukoyaka-dopeness.specification"], undefined);
    } finally {
      rendered.cleanup();
    }
  });
}

test("Cancel and Escape preserve the Event draft during Dataset-wide upgrade confirmation", async () => {
  const rendered = await renderCandidateApp("en", stableDataset);
  try {
    openCandidateEvent(rendered.document, "Stable Event");
    const approximation = rendered.document.querySelector('input[type="checkbox"]');
    assert.ok(approximation);
    act(() => approximation.click());

    const save = buttonByText(rendered.document, "Save Event");
    assert.ok(save);
    act(() => save.click());
    const cancel = buttonByText(rendered.document, "Cancel");
    assert.ok(cancel);
    act(() => cancel.dispatchEvent(new rendered.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));

    assert.equal(rendered.document.querySelector(".timeline-screen"), null);
    assert.equal(approximation.checked, true);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));

    act(() => buttonByText(rendered.document, "Save Event")?.click());
    const cancelButton = buttonByText(rendered.document, "Cancel");
    assert.ok(cancelButton);
    act(() => cancelButton.click());

    assert.equal(rendered.document.querySelector(".timeline-screen"), null);
    assert.equal(approximation.checked, true);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
  } finally {
    rendered.cleanup();
  }
});

test("backdrop dismissal cancels the Dataset-wide upgrade confirmation without mutation", async () => {
  const rendered = await renderCandidateApp("en", stableDataset);
  try {
    openCandidateEvent(rendered.document, "Stable Event");
    const approximation = rendered.document.querySelector('input[type="checkbox"]');
    assert.ok(approximation);
    act(() => approximation.click());

    const save = buttonByText(rendered.document, "Save Event");
    assert.ok(save);
    act(() => {
      save.focus();
      save.click();
    });
    const dialog = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(dialog);
    const persistedBeforeDismissal = rendered.window.localStorage.getItem("narrativeline.lastDataset");

    act(() => dialog.querySelector("h2")?.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true })));
    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), dialog);

    const backdrop = rendered.document.querySelector(".modal-backdrop");
    assert.ok(backdrop);
    act(() => backdrop.dispatchEvent(new rendered.window.MouseEvent("click", { bubbles: true, cancelable: true })));

    assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null);
    assert.ok(rendered.document.querySelector(".detail-screen--event"));
    assert.equal(approximation.checked, true);
    assert.equal(rendered.document.activeElement, save);
    assert.equal(rendered.window.localStorage.getItem("narrativeline.lastDataset"), persistedBeforeDismissal);

    const persisted = JSON.parse(rendered.window.localStorage.getItem("narrativeline.lastDataset"));
    assert.deepEqual(persisted.events[0].extensions.history, { time: { year: 1900 } });
    assert.equal(persisted.extensions["draft.github.sukoyaka-dopeness.specification"], undefined);
  } finally {
    rendered.cleanup();
  }
});

test("Japanese History upgrade confirmation uses the approved copy and right-aligned actions", async () => {
  const rendered = await renderCandidateApp("ja", stableDataset);
  try {
    openCandidateEvent(rendered.document, "Stable Event");
    const approximation = rendered.document.querySelector('input[type="checkbox"]');
    assert.ok(approximation);
    act(() => approximation.click());

    const save = buttonByText(rendered.document, "できごとを保存");
    assert.ok(save);
    act(() => save.click());

    const dialog = rendered.document.querySelector('[role="alertdialog"]');
    assert.ok(dialog);
    assert.equal(dialog.querySelector("h2")?.textContent, "日付と時刻をおおよその値として記録しますか？");
    assert.equal(
      dialog.querySelector("p")?.textContent,
      "この変更を保存すると、このDataset内の互換性のある記録日時もHistory 2形式へ更新されます。記録日時の意味と精度は保持され、正確な日時範囲は推測されません。キャンセルした場合、Dataset全体は変更されません。",
    );
    assert.ok(dialog.querySelector(".history-upgrade-actions"));
    assert.equal(dialog.querySelector(".history-upgrade-actions")?.children[0]?.textContent, "キャンセル");
  } finally {
    rendered.cleanup();
  }
});
