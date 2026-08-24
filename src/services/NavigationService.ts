import type { AppState, Screen } from "../state/AppState";
import type { Dataset } from "../models/Dataset";

export const NARRATIVE_LINE_HISTORY_KEY = "narrativeLineView";

type NarrativeLineHistoryState = Pick<
  AppState,
  | "currentScreen"
  | "selectedEvent"
  | "selectedEntity"
  | "returnEventId"
  | "returnEntityId"
  | "draftEventId"
>;

type NarrativeLineHistoryPayload = NarrativeLineHistoryState & {
  navigationIndex?: number;
};

function isValidNavigationIndex(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function toHistoryState(state: AppState): NarrativeLineHistoryState {
  return {
    currentScreen: state.currentScreen,
    selectedEvent: state.selectedEvent,
    selectedEntity: state.selectedEntity,
    returnEventId: state.returnEventId,
    returnEntityId: state.returnEntityId,
    draftEventId: state.draftEventId,
  };
}

function toHistoryPayload(
  state: AppState,
  navigationIndex: number,
): NarrativeLineHistoryPayload {
  return { ...toHistoryState(state), navigationIndex };
}

export function isNarrativeLineHistoryState(
  value: unknown,
): value is Record<typeof NARRATIVE_LINE_HISTORY_KEY, NarrativeLineHistoryState> {
  if (!value || typeof value !== "object") return false;

  const owned = (value as Record<string, unknown>)[NARRATIVE_LINE_HISTORY_KEY];
  if (!owned || typeof owned !== "object") return false;

  const screen = (owned as Record<string, unknown>).currentScreen;
  return [
    "home",
    "timeline",
    "eventDetail",
    "entityPicker",
    "entityCreate",
    "entityDetail",
  ].includes(screen as string);
}

export function readNarrativeLineHistoryState(
  value: unknown,
): NarrativeLineHistoryState | undefined {
  if (!isNarrativeLineHistoryState(value)) return undefined;

  const navigationState = {
    ...(value[NARRATIVE_LINE_HISTORY_KEY] as NarrativeLineHistoryPayload),
  };
  delete navigationState.navigationIndex;
  return navigationState;
}

export function readNarrativeLineNavigationIndex(
  value: unknown,
): number | undefined {
  if (!isNarrativeLineHistoryState(value)) return undefined;
  const navigationIndex = (value[NARRATIVE_LINE_HISTORY_KEY] as NarrativeLineHistoryPayload).navigationIndex;
  return isValidNavigationIndex(navigationIndex) ? navigationIndex : undefined;
}

export function reconcileRestoredNavigationState(
  state: NarrativeLineHistoryState,
  dataset: Dataset,
): NarrativeLineHistoryState {
  const eventExists = (id: string | null) =>
    id !== null && dataset.events.some((event) => event.id === id);
  const entityExists = (id: string | null) =>
    id !== null && dataset.entities.some((entity) => entity.id === id);
  const selectedEvent = eventExists(state.selectedEvent) ? state.selectedEvent : null;
  const selectedEntity = entityExists(state.selectedEntity) ? state.selectedEntity : null;
  const returnEventId = eventExists(state.returnEventId) ? state.returnEventId : null;
  const returnEntityId = entityExists(state.returnEntityId) ? state.returnEntityId : null;
  const draftEventId = eventExists(state.draftEventId) ? state.draftEventId : null;

  if (
    (state.currentScreen === "eventDetail" && selectedEvent === null) ||
    ((state.currentScreen === "entityPicker" || state.currentScreen === "entityCreate") && selectedEvent === null) ||
    (state.currentScreen === "entityDetail" && selectedEntity === null)
  ) {
    return { ...state, currentScreen: "timeline", selectedEvent: null, selectedEntity: null, returnEventId: null, returnEntityId: null, draftEventId: null };
  }

  return { ...state, selectedEvent, selectedEntity, returnEventId, returnEntityId, draftEventId };
}

export function replaceInitialHistoryEntry(state: AppState): void {
  if (typeof window === "undefined") return;

  const currentIndex = readNarrativeLineNavigationIndex(window.history.state) ?? 0;

  window.history.replaceState(
    {
      ...(window.history.state ?? {}),
      [NARRATIVE_LINE_HISTORY_KEY]: toHistoryPayload(state, currentIndex),
    },
    "",
    window.location.href,
  );
}

export function pushNavigationHistoryEntry(state: AppState): void {
  if (typeof window === "undefined") return;

  const currentIndex = readNarrativeLineNavigationIndex(window.history.state);
  const nextIndex = currentIndex === undefined ? 1 : currentIndex + 1;

  if (currentIndex === undefined && isNarrativeLineHistoryState(window.history.state)) {
    window.history.replaceState(
      {
        ...(window.history.state ?? {}),
        [NARRATIVE_LINE_HISTORY_KEY]: {
          ...window.history.state[NARRATIVE_LINE_HISTORY_KEY],
          navigationIndex: 0,
        },
      },
      "",
      window.location.href,
    );
  }

  window.history.pushState(
    {
      ...(window.history.state ?? {}),
      [NARRATIVE_LINE_HISTORY_KEY]: toHistoryPayload(state, nextIndex),
    },
    "",
    window.location.href,
  );
}

export function replaceCurrentNavigationEntry(state: AppState): void {
  if (typeof window === "undefined") return;

  const currentIndex = readNarrativeLineNavigationIndex(window.history.state) ?? 0;

  window.history.replaceState(
    {
      ...(window.history.state ?? {}),
      [NARRATIVE_LINE_HISTORY_KEY]: toHistoryPayload(state, currentIndex),
    },
    "",
    window.location.href,
  );
}

export function rebaseCurrentNavigationEntry(state: AppState): void {
  if (typeof window === "undefined") return;

  window.history.replaceState(
    {
      ...(window.history.state ?? {}),
      [NARRATIVE_LINE_HISTORY_KEY]: toHistoryPayload(state, 0),
    },
    "",
    window.location.href,
  );
}

export function navigate(
  state: AppState,
  screen: Screen
): AppState {
  const nextState = {
    ...state,
    currentScreen: screen,
  };

  return nextState;
}
