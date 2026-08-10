export type Screen =
  | "home"
  | "timeline"
  | "eventDetail"
  | "entityPicker"
  | "entityCreate"
  | "entityDetail";

export interface AppState {
  currentScreen: Screen;
  currentDialog: string | null;
  selectedEvent: string | null;
  selectedEntity: string | null;
  returnEventId: string | null;
  returnEntityId: string | null;
  draftEventId: string | null;
}
