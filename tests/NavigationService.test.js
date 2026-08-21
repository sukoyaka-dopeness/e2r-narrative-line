import assert from "node:assert/strict";
import test from "node:test";
import {
  isNarrativeLineHistoryState,
  navigate,
  readNarrativeLineHistoryState,
} from "../src/services/NavigationService.ts";

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
