import type { AppState, Screen } from "../state/AppState";

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
