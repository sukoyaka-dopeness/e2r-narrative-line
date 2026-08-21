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
  return isNarrativeLineHistoryState(value)
    ? value[NARRATIVE_LINE_HISTORY_KEY]
    : undefined;
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

  window.history.replaceState(
    {
      ...(window.history.state ?? {}),
      [NARRATIVE_LINE_HISTORY_KEY]: toHistoryState(state),
    },
    "",
    window.location.href,
  );
}

export function pushNavigationHistoryEntry(state: AppState): void {
  if (typeof window === "undefined") return;

  window.history.pushState(
    {
      ...(window.history.state ?? {}),
      [NARRATIVE_LINE_HISTORY_KEY]: toHistoryState(state),
    },
    "",
    window.location.href,
  );
}

export function replaceCurrentNavigationEntry(state: AppState): void {
  if (typeof window === "undefined") return;

  window.history.replaceState(
    {
      ...(window.history.state ?? {}),
      [NARRATIVE_LINE_HISTORY_KEY]: toHistoryState(state),
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
