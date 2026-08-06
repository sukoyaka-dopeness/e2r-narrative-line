import type { CoreObject } from "./CoreObject";

export interface Relation extends CoreObject {
  sourceId: string;
  targetId: string;
}
