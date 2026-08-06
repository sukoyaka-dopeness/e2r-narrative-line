import type { CoreObject } from "./CoreObject";
import type { HistoryExtension } from "./HistoryExtension";

export interface EventExtensions {
  history?: HistoryExtension;
  [key: string]: unknown;
}

export interface Event extends CoreObject {
  extensions?: EventExtensions;
}
