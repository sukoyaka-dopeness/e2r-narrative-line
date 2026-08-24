import assert from "node:assert/strict";
import test from "node:test";
import {
  isNarrativeLineHistoryState,
  navigate,
  pushNavigationHistoryEntry,
  readNarrativeLineNavigationIndex,
  readNarrativeLineHistoryState,
  reconcileRestoredNavigationState,
  replaceCurrentNavigationEntry,
  rebaseCurrentNavigationEntry,
  replaceInitialHistoryEntry,
} from "../src/services/NavigationService.ts";
import { createDomTestEnvironment } from "./helpers/dom-test-environment.js";

const dataset = {
  version: "1.0",
  entities: [{ id: "entity-1" }],
  events: [{ id: "event-1" }],
  relations: [],
};

const ownedState = {
  narrativeLineView: {
    currentScreen: "eventDetail",
    selectedEvent: "event-1",
    selectedEntity: null,
    returnEventId: null,
    returnEntityId: null,
    draftEventId: null,
  },
};

test("recognizes owned screen state without Dataset content", () => {
  assert.equal(isNarrativeLineHistoryState(ownedState), true);
  assert.deepEqual(readNarrativeLineHistoryState(ownedState), ownedState.narrativeLineView);
  assert.equal(JSON.stringify(ownedState).includes("entities"), false);
});

test("ignores foreign, unknown, and malformed history state", () => {
  assert.equal(isNarrativeLineHistoryState(null), false);
  assert.equal(isNarrativeLineHistoryState({ foreignApp: { screen: "home" } }), false);
  assert.equal(isNarrativeLineHistoryState({ narrativeLineView: { currentScreen: "unknown" } }), false);
  assert.equal(readNarrativeLineHistoryState({ narrativeLineView: null }), undefined);
});

test("keeps legacy state readable and does not expose an index", () => {
  assert.equal(readNarrativeLineNavigationIndex(ownedState), undefined);
  assert.deepEqual(readNarrativeLineHistoryState(ownedState), ownedState.narrativeLineView);
});

test("reads an indexed state without leaking navigation metadata", () => {
  const indexed = { narrativeLineView: { ...ownedState.narrativeLineView, navigationIndex: 3 } };
  const restored = readNarrativeLineHistoryState(indexed);
  assert.equal(readNarrativeLineNavigationIndex(indexed), 3);
  assert.equal(Object.hasOwn(restored, "navigationIndex"), false);
  assert.deepEqual(restored, ownedState.narrativeLineView);
});

test("malformed navigation indexes degrade without invalidating owned state", () => {
  for (const navigationIndex of [-1, 1.5, "1"]) {
    const malformed = { narrativeLineView: { ...ownedState.narrativeLineView, navigationIndex } };
    assert.equal(isNarrativeLineHistoryState(malformed), true);
    assert.equal(readNarrativeLineNavigationIndex(malformed), undefined);
  }
});

function createHistoryState(overrides = {}) {
  return {
    ...ownedState.narrativeLineView,
    ...overrides,
  };
}

test("initial, replace, and push writers maintain indexed application history", () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en&probe=keep");
  try {
    const home = createHistoryState({ currentScreen: "home" });
    replaceInitialHistoryEntry(home);
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 0);
    replaceCurrentNavigationEntry(createHistoryState({ currentScreen: "timeline" }));
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 0);
    pushNavigationHistoryEntry(createHistoryState({ currentScreen: "eventDetail" }));
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 1);
    pushNavigationHistoryEntry(createHistoryState({ currentScreen: "entityPicker" }));
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 2);
    assert.equal(window.location.hash, "#locale=en&probe=keep");
  } finally {
    environment.cleanup();
  }
});

test("initial writer preserves an existing valid index", () => {
  const environment = createDomTestEnvironment();
  try {
    window.history.replaceState({ narrativeLineView: createHistoryState({ navigationIndex: 7 }) }, "", window.location.href);
    replaceInitialHistoryEntry(createHistoryState({ currentScreen: "timeline" }));
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 7);
    assert.equal(readNarrativeLineHistoryState(window.history.state).currentScreen, "timeline");
  } finally {
    environment.cleanup();
  }
});

test("safe rebase forces index zero while preserving target state, root state, and URL", () => {
  const environment = createDomTestEnvironment("https://narrativeline.test/#locale=en&probe=keep");
  try {
    const target = createHistoryState({ currentScreen: "timeline", navigationIndex: 7 });
    window.history.replaceState({ foreignKey: { value: 2 }, narrativeLineView: target }, "", window.location.href);
    const beforeUrl = window.location.href;
    rebaseCurrentNavigationEntry(target);
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 0);
    assert.equal(readNarrativeLineHistoryState(window.history.state).currentScreen, "timeline");
    assert.equal(Object.hasOwn(readNarrativeLineHistoryState(window.history.state), "navigationIndex"), false);
    assert.deepEqual(window.history.state.foreignKey, { value: 2 });
    assert.equal(window.location.href, beforeUrl);
  } finally {
    environment.cleanup();
  }
});

test("ordinary replace preserves a valid navigation index after safe rebase exists", () => {
  const environment = createDomTestEnvironment();
  try {
    window.history.replaceState({ narrativeLineView: createHistoryState({ navigationIndex: 7 }) }, "", window.location.href);
    replaceCurrentNavigationEntry(createHistoryState({ currentScreen: "timeline" }));
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 7);
  } finally {
    environment.cleanup();
  }
});

test("legacy owned current entry is normalized before push while preserving its screen", () => {
  const environment = createDomTestEnvironment();
  try {
    window.history.replaceState({ foreignKey: { value: 1 }, narrativeLineView: createHistoryState({ currentScreen: "timeline" }) }, "", window.location.href);
    pushNavigationHistoryEntry(createHistoryState({ currentScreen: "eventDetail" }));
    assert.equal(readNarrativeLineNavigationIndex(window.history.state), 1);
    assert.deepEqual(window.history.state.foreignKey, { value: 1 });
  } finally {
    environment.cleanup();
  }
});

test("navigation calculation is side-effect free and same-screen updates stay in one state", () => {
  const state = {
    currentScreen: "timeline",
    currentDialog: null,
    selectedEvent: "event-1",
    selectedEntity: null,
    returnEventId: null,
    returnEntityId: null,
    draftEventId: null,
  };

  assert.deepEqual(navigate(state, "timeline"), state);
  assert.equal(navigate(state, "eventDetail").currentScreen, "eventDetail");
});

test("restored stale detail state falls back to the current Dataset timeline", () => {
  const restored = reconcileRestoredNavigationState({
    currentScreen: "eventDetail", selectedEvent: "old-event", selectedEntity: null,
    returnEventId: null, returnEntityId: null, draftEventId: null,
  }, dataset);
  assert.equal(restored.currentScreen, "timeline");
  assert.equal(restored.selectedEvent, null);
});

test("restored valid detail state remains available in the current Dataset", () => {
  const restored = reconcileRestoredNavigationState({
    currentScreen: "eventDetail", selectedEvent: "event-1", selectedEntity: null,
    returnEventId: null, returnEntityId: null, draftEventId: null,
  }, dataset);
  assert.equal(restored.currentScreen, "eventDetail");
  assert.equal(restored.selectedEvent, "event-1");
});
