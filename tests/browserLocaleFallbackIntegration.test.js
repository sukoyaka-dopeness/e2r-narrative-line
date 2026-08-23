import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

async function renderApp({ hash = "", languages, language, persistedLocale }) {
  const environment = createDomTestEnvironment(`https://narrativeline.test/${hash}`);
  environment.window.scrollTo = () => {};
  Object.defineProperty(environment.window.navigator, "languages", { configurable: true, value: languages });
  Object.defineProperty(environment.window.navigator, "language", { configurable: true, value: language });
  if (persistedLocale) environment.window.localStorage.setItem("narrativeline.language", persistedLocale);
  const container = environment.document.createElement("div"); environment.document.body.append(container);
  const root = createRoot(container);
  const server = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const [{ default: App }, { LanguageProvider }] = await Promise.all([server.ssrLoadModule("/src/App.tsx"), server.ssrLoadModule("/src/i18n/LanguageContext.tsx")]);
    await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(App))));
  } finally { await server.close(); }
  return { ...environment, root, cleanup() { act(() => root.unmount()); environment.cleanup(); } };
}

test("uses Japanese browser fallback without persisting inferred locale", async () => {
  const rendered = await renderApp({ languages: ["ja-JP"], language: "ja-JP" });
  try { assert.equal(rendered.document.querySelector("h1")?.textContent, "はじめる"); assert.equal(rendered.document.querySelector('button[type="button"]')?.textContent, "English"); assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), null); assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null); assert.equal(rendered.window.location.hash, ""); } finally { rendered.cleanup(); }
});
test("falls back to English for unsupported browser locales without persisting", async () => {
  const rendered = await renderApp({ languages: ["fr-FR"], language: "fr-FR" });
  try { assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started"); assert.notEqual(rendered.document.querySelector('button[type="button"]')?.textContent, "English"); assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), null); } finally { rendered.cleanup(); }
});
test("keeps persisted English ahead of Japanese browser fallback", async () => {
  const rendered = await renderApp({ languages: ["ja-JP"], language: "ja-JP", persistedLocale: "en" });
  try { assert.equal(rendered.document.querySelector("h1")?.textContent, "Get Started"); assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "en"); assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null); } finally { rendered.cleanup(); }
});
test("keeps requested Japanese ahead of English browser fallback without persisting", async () => {
  const rendered = await renderApp({ hash: "#locale=ja", languages: ["en-US"], language: "en-US" });
  try { assert.equal(rendered.document.querySelector("h1")?.textContent, "はじめる"); assert.equal(rendered.document.querySelector('header button')?.textContent, "English"); assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), null); assert.equal(rendered.document.querySelector('[role="alertdialog"]'), null); } finally { rendered.cleanup(); }
});
test("explicit Header selector persists and synchronizes only locale", async () => {
  const rendered = await renderApp({ hash: "#datasetUrl=https%3A%2F%2Fdata.example%2Fsample.json&foo=a%2Fb" });
  const calls = []; const original = rendered.window.history.replaceState.bind(rendered.window.history);
  rendered.window.history.replaceState = (state, unused, url) => { calls.push({ state, unused, url }); return original(state, unused, url); };
  rendered.window.history.pushState = () => { throw new Error("locale selector must not push history"); };
  try { await act(async () => rendered.document.querySelector("header button").click()); assert.equal(rendered.document.querySelector('header button')?.textContent, "English"); assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "ja"); assert.equal(rendered.window.location.hash, "#datasetUrl=https%3A%2F%2Fdata.example%2Fsample.json&foo=a%2Fb&locale=ja"); assert.equal(calls.length, 1); assert.equal(calls[0].state, rendered.window.history.state); } finally { rendered.cleanup(); }
});
test("explicit Header selector repairs invalid and duplicate owned locale", async () => {
  const rendered = await renderApp({ hash: "#foo=bar&locale=fr&locale=ja&x=" });
  try { await act(async () => rendered.document.querySelector("header button").click()); assert.equal(rendered.window.location.hash, "#foo=bar&locale=ja&x="); assert.equal(rendered.window.localStorage.getItem("narrativeline.language"), "ja"); } finally { rendered.cleanup(); }
});
