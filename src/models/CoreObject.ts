export interface CoreObject {
  id: string;
  name?: string;
  description?: string;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}
