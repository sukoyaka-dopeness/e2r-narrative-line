import { createDomTestEnvironment as createSharedDomTestEnvironment } from "@sukoyaka-dopeness/e2r-dom-test-environment";

class SingleTabLockManager {
  held = new Map();
  queues = new Map();
  request(name, optionsOrCallback, maybeCallback) {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    if (this.held.has(name) && name.startsWith("e2r:narrativeline:workspace-tab:")) return Promise.resolve(callback(null));
    const acquire = this.held.has(name)
      ? new Promise((resolve) => this.queues.set(name, [...(this.queues.get(name) ?? []), resolve]))
      : Promise.resolve();
    return acquire.then(async () => {
      const lock = { name };
      this.held.set(name, lock);
      try { return await callback(lock); }
      finally {
        if (name === "e2r:narrativeline:workspace-write" || name.startsWith("e2r:narrativeline:workspace-tab:")) {
          const queue = this.queues.get(name) ?? [];
          const next = queue.shift();
          if (queue.length) this.queues.set(name, queue);
          else this.queues.delete(name);
          if (next) next();
          else this.held.delete(name);
        }
      }
    });
  }
  async query() { return { held: [...this.held.values()] }; }
}

export function createDomTestEnvironment(options = {}) {
  const normalizedOptions = typeof options === "string" ? { url: options } : options;
  const {
    url = "https://narrativeline.test/",
    globals: additionalGlobals = {},
  } = normalizedOptions;

  const environment = createSharedDomTestEnvironment({
    url,
    globals: {
      IS_REACT_ACT_ENVIRONMENT: true,
      ...additionalGlobals,
    },
  });
  Object.defineProperty(environment.window.navigator, "locks", {
    configurable: true,
    value: new SingleTabLockManager(),
  });
  return environment;
}
