import { JSDOM } from "jsdom";

export function createDomTestEnvironment(options = {}) {
  const normalizedOptions = typeof options === "string" ? { url: options } : options;
  const {
    url = "https://narrativeline.test/",
    globals: additionalGlobals = {},
  } = normalizedOptions;
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url });
  const originalDescriptors = new Map();
  const cleanupCallbacks = [];
  let cleanupStarted = false;
  let cleanupFinished = false;

  const installGlobal = (name, value) => {
    if (cleanupStarted) {
      throw new Error(`Cannot install global ${name} after cleanup has started`);
    }
    if (!originalDescriptors.has(name)) {
      originalDescriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    }
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };

  const restoreGlobals = () => {
    for (const [name, descriptor] of originalDescriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  };

  const cleanup = async () => {
    if (cleanupFinished) return;
    cleanupStarted = true;
    const errors = [];
    while (cleanupCallbacks.length > 0) {
      const callback = cleanupCallbacks.pop();
      try {
        await callback();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      dom.window.close();
    } catch (error) {
      errors.push(error);
    }
    try {
      restoreGlobals();
    } catch (error) {
      errors.push(error);
    }
    cleanupFinished = true;
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, "UI test environment cleanup failed");
  };

  const environment = {
    window: dom.window,
    document: dom.window.document,
    installGlobal,
    addCleanup(callback) {
      if (cleanupStarted) throw new Error("Cannot register cleanup after cleanup has started");
      cleanupCallbacks.push(callback);
    },
    cleanup,
  };

  const defaultGlobals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    localStorage: dom.window.localStorage,
    sessionStorage: dom.window.sessionStorage,
    history: dom.window.history,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  };

  for (const [name, value] of Object.entries(defaultGlobals)) installGlobal(name, value);
  for (const [name, value] of Object.entries(additionalGlobals)) installGlobal(name, value);
  return environment;
}
