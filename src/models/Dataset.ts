import type { Entity } from "./Entity";
import type { Event } from "./Event";
import type { MetadataExtension } from "./MetadataExtension";
import type { Relation } from "./Relation";

export interface DatasetExtensions {
  metadata?: MetadataExtension;
  [key: string]: unknown;
}

export interface Dataset {
  version: string;
  entities: Entity[];
  events: Event[];
  relations: Relation[];
  extensions?: DatasetExtensions;
  [key: string]: unknown;
}
