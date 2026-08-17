import type { Dataset } from "../models/Dataset";

const points = [[400, 250], [150, 120], [250, 400], [550, 400], [650, 120], [650, 250]] as const;
const coordinate = (x: number, y: number) => ({ extensions: { "draft.github.sukoyaka-dopeness.coordinate": { coordinates: [{ spaceId: "liaisonscape-graph", values: { x, y } }] } } });
const declaration = { "draft.github.sukoyaka-dopeness.specification": { specVersion: "0.1.0", uses: [{ extension: "metadata", version: "1.0.0" }, { extension: "history", version: "1.0.0" }, { extension: "draft.github.sukoyaka-dopeness.coordinate", version: "0.1.0" }] } };

const content = {
  en: {
    title: "Apollo 11 Mission",
    entities: [["apollo", "Apollo 11", "The first crewed mission to land on the Moon."], ["nasa", "NASA", "The agency that planned and operated the Apollo program."], ["armstrong", "Neil Armstrong", "Apollo 11 commander and first person to walk on the Moon."], ["aldrin", "Buzz Aldrin", "Apollo 11 lunar module pilot."], ["collins", "Michael Collins", "Apollo 11 command module pilot."], ["moon", "Moon", "Earth's natural satellite and the mission's destination."]],
    events: [["launch", "Apollo 11 launches", "Apollo 11 lifted off from Kennedy Space Center.", { year: 1969, month: 7, day: 16 }], ["orbit", "Lunar orbit insertion", "The crew entered orbit around the Moon.", { year: 1969, month: 7, day: 19 }], ["landing", "The Eagle lands", "The lunar module landed in the Sea of Tranquility.", { year: 1969, month: 7, day: 20 }], ["step", "First step on the Moon", "Armstrong stepped onto the lunar surface, followed by Aldrin.", { year: 1969, month: 7, day: 21 }], ["return", "Pacific splashdown", "The crew returned safely to Earth.", { year: 1969, month: 7, day: 24 }]],
    names: ["operates", "commands", "flies with", "supports", "orbits", "lands on", "walks on", "returns with"],
  },
  ja: {
    title: "\u30a2\u30dd\u30ed11\u53f7\u306e\u6708\u9762\u7740\u9678",
    entities: [["apollo", "\u30a2\u30dd\u30ed11\u53f7", "\u4eba\u985e\u3092\u521d\u3081\u3066\u6708\u9762\u3078\u9001\u308a\u5c4a\u3051\u305f\u6709\u4eba\u63a2\u67fb\u30df\u30c3\u30b7\u30e7\u30f3\u3002"], ["nasa", "NASA", "\u30a2\u30dd\u30ed\u8a08\u753b\u3092\u8a08\u753b\u30fb\u904b\u7528\u3057\u305f\u6a5f\u95a2\u3002"], ["armstrong", "\u30cb\u30fc\u30eb\u30fb\u30a2\u30fc\u30e0\u30b9\u30c8\u30ed\u30f3\u30b0", "\u30a2\u30dd\u30ed11\u53f7\u8239\u9577\u3067\u3001\u6708\u9762\u306b\u7acb\u3063\u305f\u6700\u521d\u306e\u4eba\u7269\u3002"], ["aldrin", "\u30d0\u30ba\u30fb\u30aa\u30eb\u30c9\u30ea\u30f3", "\u30a2\u30dd\u30ed11\u53f7\u306e\u6708\u7740\u9678\u8239\u64cd\u7e26\u58eb\u3002"], ["collins", "\u30de\u30a4\u30b1\u30eb\u30fb\u30b3\u30ea\u30f3\u30ba", "\u30a2\u30dd\u30ed11\u53f7\u306e\u53f8\u4ee4\u8239\u64cd\u7e26\u58eb\u3002"], ["moon", "\u6708", "\u5730\u7403\u306e\u885b\u661f\u3067\u3042\u308a\u3001\u30df\u30c3\u30b7\u30e7\u30f3\u306e\u76ee\u7684\u5730\u3002"]],
    events: [["launch", "\u30a2\u30dd\u30ed11\u53f7\u6253\u3061\u4e0a\u3052", "\u30a2\u30dd\u30ed11\u53f7\u304c\u30b1\u30cd\u30c7\u30a3\u5b87\u5b99\u30bb\u30f3\u30bf\u30fc\u304b\u3089\u6253\u3061\u4e0a\u3052\u3089\u308c\u305f\u3002", { year: 1969, month: 7, day: 16 }], ["orbit", "\u6708\u5468\u56de\u8ecc\u9053\u3078\u6295\u5165", "\u4e57\u7d44\u54e1\u304c\u6708\u306e\u5468\u56de\u8ecc\u9053\u306b\u5165\u3063\u305f\u3002", { year: 1969, month: 7, day: 19 }], ["landing", "\u30a4\u30fc\u30b0\u30eb\u6708\u9762\u7740\u9678", "\u6708\u7740\u9678\u8239\u304c\u9759\u304b\u306e\u6d77\u306b\u7740\u9678\u3057\u305f\u3002", { year: 1969, month: 7, day: 20 }], ["step", "\u6708\u9762\u3078\u306e\u7b2c\u4e00\u6b69", "\u30a2\u30fc\u30e0\u30b9\u30c8\u30ed\u30f3\u30b0\u306b\u7d9a\u3044\u3066\u30aa\u30eb\u30c9\u30ea\u30f3\u304c\u964d\u308a\u7acb\u3063\u305f\u3002", { year: 1969, month: 7, day: 21 }], ["return", "\u592a\u5e73\u6d0b\u3078\u306e\u5e30\u9084", "\u4e57\u7d44\u54e1\u304c\u7121\u4e8b\u306b\u5730\u7403\u3078\u5e30\u9084\u3057\u305f\u3002", { year: 1969, month: 7, day: 24 }]],
    names: ["\u904b\u7528\u3059\u308b", "\u6307\u63ee\u3059\u308b", "\u5171\u306b\u98db\u884c\u3059\u308b", "\u652f\u63f4\u3059\u308b", "\u5468\u56de\u3059\u308b", "\u7740\u9678\u3059\u308b", "\u6b69\u304f", "\u5171\u306b\u5e30\u9084\u3059\u308b"],
  },
} as const;

function createSample(language: "en" | "ja"): Dataset {
  const value = content[language];
  const entities = value.entities.map(([id, name, description], index) => ({ id: `entity-${id}`, name, description, ...coordinate(points[index][0], points[index][1]) }));
  const events = value.events.map(([id, name, description, time]) => ({ id: `event-${id}`, name, description, extensions: { history: { time } } }));
  const rel = (id: string, name: string, sourceId: string, targetId: string) => ({ id: `relation-${id}`, name, sourceId, targetId });
  const n = value.names;
  const relations = [rel("nasa-apollo", n[0], "entity-nasa", "entity-apollo"), rel("apollo-armstrong", n[1], "entity-apollo", "entity-armstrong"), rel("armstrong-aldrin", n[2], "entity-armstrong", "entity-aldrin"), rel("armstrong-collins", n[2], "entity-armstrong", "entity-collins"), rel("apollo-moon", n[3], "entity-apollo", "entity-moon"), rel("nasa-loop", language === "en" ? "mission control loop" : "\u30df\u30c3\u30b7\u30e7\u30f3\u7ba1\u5236\u306e\u5faa\u74b0", "entity-nasa", "entity-nasa"), rel("launch-apollo", n[0], "event-launch", "entity-apollo"), rel("launch-nasa", n[3], "event-launch", "entity-nasa"), rel("orbit-moon", n[4], "event-orbit", "entity-moon"), rel("landing-moon", n[5], "event-landing", "entity-moon"), rel("step-armstrong", n[6], "event-step", "entity-armstrong"), rel("step-aldrin", n[6], "event-step", "entity-aldrin"), rel("return-armstrong", n[7], "event-return", "entity-armstrong"), rel("return-collins", n[7], "event-return", "entity-collins")];
  return { version: "1.0", entities, events, relations, extensions: { metadata: { datasetId: `example-apollo-11-${language}`, title: value.title }, "draft.github.sukoyaka-dopeness.coordinate": { specVersion: "0.1.0", spaces: [{ id: "liaisonscape-graph", name: "LiaisonScape graph coordinates", kind: "cartesian-2d", components: { x: { unit: "liaisonscape-user-unit", positiveDirection: "display-right" }, y: { unit: "liaisonscape-user-unit", positiveDirection: "display-down" } } }] }, ...declaration } };
}

export const sampleDataset = createSample("ja");
export const sampleDatasetEn = createSample("en");
