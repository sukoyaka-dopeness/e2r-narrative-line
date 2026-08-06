import type { AppState, Screen } from "../state/AppState";

export function navigate(
  state: AppState,
  screen: Screen
): AppState {
  return {
    ...state,
    currentScreen: screen,
  };
}