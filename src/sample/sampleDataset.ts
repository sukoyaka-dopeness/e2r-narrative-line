import type { Dataset } from "../models/Dataset";

export const sampleDataset: Dataset = {
  version: "1.0",
  extensions: {
    metadata: {
      datasetId: "019c2f9a-7c31-7a8e-8c4b-1d2e3f4a5b6c",
      title: "織田信長の歩み",
    },
  },
  events: [
    {
      id: "event-001",
      name: "桶狭間の戦い",
      description: "織田信長が今川義元を破り、飛躍のきっかけをつかんだ。",
      extensions: { history: { time: { year: 1560, month: 6, day: 12 } } },
    },
    {
      id: "event-003",
      name: "清洲同盟",
      description: "織田信長と徳川家康が同盟を結んだ。",
      extensions: { history: { time: { year: 1562 } } },
    },
    {
      id: "event-004",
      name: "美濃攻略",
      description: "織田信長が美濃を攻略し、岐阜を拠点とした。",
      extensions: { history: { time: { year: 1567 } } },
    },
    {
      id: "event-005",
      name: "上洛",
      description: "織田信長が足利義昭を奉じて京都へ入った。",
      extensions: { history: { time: { year: 1568, month: 10 } } },
    },
    {
      id: "event-006",
      name: "長篠の戦い",
      description: "織田・徳川連合軍が武田軍を破った。",
      extensions: { history: { time: { year: 1575, month: 6, day: 29 } } },
    },
    {
      id: "event-007",
      name: "本能寺の変",
      description: "明智光秀の謀反により、織田信長が本能寺で倒れた。",
      extensions: { history: { time: { year: 1582, month: 6, day: 21 } } },
    },
  ],
  entities: [
    { id: "entity-003", name: "織田信長", description: "戦国時代から安土桃山時代の武将。" },
    { id: "entity-004", name: "徳川家康", description: "織田信長と同盟を結んだ武将。" },
    { id: "entity-005", name: "今川義元", description: "桶狭間の戦いで織田信長と戦った大名。" },
    { id: "entity-006", name: "明智光秀", description: "本能寺の変を起こした武将。" },
    { id: "entity-007", name: "武田勝頼", description: "長篠の戦いで織田・徳川連合軍と戦った武将。" },
    { id: "entity-008", name: "足利義昭", description: "織田信長に奉じられて上洛した室町幕府の将軍。" },
  ],
  relations: [
    { id: "relation-003", sourceId: "event-001", targetId: "entity-003" },
    { id: "relation-004", sourceId: "event-001", targetId: "entity-005" },
    { id: "relation-005", sourceId: "event-003", targetId: "entity-003" },
    { id: "relation-006", sourceId: "event-003", targetId: "entity-004" },
    { id: "relation-007", sourceId: "event-004", targetId: "entity-003" },
    { id: "relation-008", sourceId: "event-005", targetId: "entity-003" },
    { id: "relation-009", sourceId: "event-005", targetId: "entity-008" },
    { id: "relation-010", sourceId: "event-006", targetId: "entity-003" },
    { id: "relation-011", sourceId: "event-006", targetId: "entity-004" },
    { id: "relation-012", sourceId: "event-006", targetId: "entity-007" },
    { id: "relation-013", sourceId: "event-007", targetId: "entity-003" },
    { id: "relation-014", sourceId: "event-007", targetId: "entity-006" },
  ],
};
