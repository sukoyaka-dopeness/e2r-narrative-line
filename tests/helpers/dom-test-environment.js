import { createDomTestEnvironment as createSharedDomTestEnvironment } from "@sukoyaka-dopeness/e2r-dom-test-environment";

export function createDomTestEnvironment(options = {}) {
  const normalizedOptions = typeof options === "string" ? { url: options } : options;
  const {
    url = "https://narrativeline.test/",
    globals: additionalGlobals = {},
  } = normalizedOptions;

  return createSharedDomTestEnvironment({
    url,
    globals: {
      IS_REACT_ACT_ENVIRONMENT: true,
      ...additionalGlobals,
    },
  });
}
