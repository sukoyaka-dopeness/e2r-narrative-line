import type { Dataset } from "../models/Dataset";
import type { Relation } from "../models/Relation";

const MIN_HINT_LENGTH = 8;
function prefixFor(id: string, length: number) { return id.slice(0, Math.min(length, id.length)); }
function uniqueHints(ids: string[]) {
  const result = new Map<string, string>();
  ids.forEach((id) => { let length = MIN_HINT_LENGTH; while (ids.some((other) => other !== id && prefixFor(other, length) === prefixFor(id, length))) length += 1; result.set(id, prefixFor(id, length)); });
  return result;
}
export function getRelationBlockerLabels(dataset: Dataset, relations: Relation[]): Map<string, string> {
  const objects = [...dataset.entities, ...dataset.events];
  const names = new Map(objects.map((object) => [object.id, object.name?.trim() || object.id]));
  const endpointIds = relations.flatMap((relation) => [relation.sourceId, relation.targetId]);
  const groups = new Map<string, string[]>();
  endpointIds.forEach((id) => { const name = names.get(id) ?? id; groups.set(name, [...(groups.get(name) ?? []), id]); });
  const endpointHints = uniqueHints([...new Set(endpointIds)].filter((id) => (groups.get(names.get(id) ?? id)?.length ?? 0) > 1));
  const endpoint = (id: string) => { const name = names.get(id) ?? id; return endpointHints.has(id) ? `${name} (${endpointHints.get(id)})` : name; };
  const base = relations.map((relation) => { const name = relation.name?.trim(); return `${name ? `${name}: ` : ""}${endpoint(relation.sourceId)} → ${endpoint(relation.targetId)}`; });
  const rendered = new Map<string, string[]>();
  base.forEach((label, index) => rendered.set(label, [...(rendered.get(label) ?? []), relations[index].id]));
  const relationHints = uniqueHints(relations.filter((_, index) => (rendered.get(base[index])?.length ?? 0) > 1).map((relation) => relation.id));
  return new Map(relations.map((relation, index) => [relation.id, relationHints.has(relation.id) ? `${base[index]} (${relationHints.get(relation.id)})` : base[index]]));
}
