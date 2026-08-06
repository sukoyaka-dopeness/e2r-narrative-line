import type { Dataset } from "../models/Dataset";

export const sampleDataset: Dataset = {
  version: "1.0",
  extensions: {
    metadata: {
      datasetId: "019c2f9a-7c31-7a8e-8c4b-1d2e3f4a5b6c",
    },
  },
  events: [
    {
      id: "event-001",
      name: "Moon Landing",
      description: "Apollo 11 landed on the Moon.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 20 } },
      },
    },
    {
      id: "event-003",
      name: "Apollo 11 Launch",
      description: "Apollo 11 launched from Kennedy Space Center.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 16 } },
      },
    },
    {
      id: "event-004",
      name: "Translunar Injection",
      description: "Apollo 11 left Earth orbit and began its journey to the Moon.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 16 } },
      },
    },
    {
      id: "event-005",
      name: "Lunar Orbit Insertion",
      description: "Apollo 11 entered orbit around the Moon.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 19 } },
      },
    },
    {
      id: "event-006",
      name: "Eagle Separation",
      description: "The lunar module Eagle separated from Columbia.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 20 } },
      },
    },
    {
      id: "event-007",
      name: "Lunar Module Descent",
      description: "Eagle descended toward the lunar surface.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 20 } },
      },
    },
    {
      id: "event-008",
      name: "First Step on the Moon",
      description: "Neil Armstrong became the first person to step onto the Moon.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 21 } },
      },
    },
    {
      id: "event-009",
      name: "Lunar Surface EVA",
      description: "Neil Armstrong and Buzz Aldrin explored the lunar surface.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 21 } },
      },
    },
    {
      id: "event-010",
      name: "Lunar Module Ascent",
      description: "Eagle lifted off from the Moon and rejoined Columbia.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 21 } },
      },
    },
    {
      id: "event-011",
      name: "Earth Reentry",
      description: "Columbia reentered Earth's atmosphere.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 24 } },
      },
    },
    {
      id: "event-012",
      name: "Pacific Splashdown",
      description: "The Apollo 11 crew safely splashed down in the Pacific Ocean.",
      extensions: {
        history: { time: { year: 1969, month: 7, day: 24 } },
      },
    },
  ],
  entities: [
    {
      id: "entity-003",
      name: "Neil Armstrong",
      description: "Apollo 11 commander.",
    },
    {
      id: "entity-004",
      name: "Buzz Aldrin",
      description: "Apollo 11 lunar module pilot.",
    },
    {
      id: "entity-005",
      name: "Michael Collins",
      description: "Apollo 11 command module pilot.",
    },
    {
      id: "entity-006",
      name: "Apollo 11",
      description: "The first crewed mission to land on the Moon.",
    },
    {
      id: "entity-007",
      name: "Saturn V",
      description: "The launch vehicle used for Apollo 11.",
    },
    {
      id: "entity-008",
      name: "NASA",
      description: "The agency responsible for the Apollo program.",
    },
    {
      id: "entity-009",
      name: "Mission Control",
      description: "The team that supported Apollo 11 from Earth.",
    },
    {
      id: "entity-010",
      name: "Columbia",
      description: "The Apollo 11 command module.",
    },
    {
      id: "entity-011",
      name: "Eagle",
      description: "The Apollo 11 lunar module.",
    },
    {
      id: "entity-012",
      name: "Moon",
      description: "Earth's natural satellite.",
    },
  ],

  relations: [
    {
      id: "relation-003",
      sourceId: "event-001",
      targetId: "entity-003",
    },
    {
      id: "relation-004",
      sourceId: "event-001",
      targetId: "entity-004",
    },
    {
      id: "relation-005",
      sourceId: "event-001",
      targetId: "entity-011",
    },
    {
      id: "relation-006",
      sourceId: "event-001",
      targetId: "entity-012",
    },
    {
      id: "relation-007",
      sourceId: "event-003",
      targetId: "entity-003",
    },
    {
      id: "relation-008",
      sourceId: "event-003",
      targetId: "entity-004",
    },
    {
      id: "relation-009",
      sourceId: "event-003",
      targetId: "entity-005",
    },
    {
      id: "relation-010",
      sourceId: "event-003",
      targetId: "entity-006",
    },
    {
      id: "relation-011",
      sourceId: "event-003",
      targetId: "entity-007",
    },
    {
      id: "relation-012",
      sourceId: "event-003",
      targetId: "entity-008",
    },
    {
      id: "relation-013",
      sourceId: "event-004",
      targetId: "entity-006",
    },
    {
      id: "relation-014",
      sourceId: "event-004",
      targetId: "entity-007",
    },
    {
      id: "relation-015",
      sourceId: "event-005",
      targetId: "entity-006",
    },
    {
      id: "relation-016",
      sourceId: "event-005",
      targetId: "entity-010",
    },
    {
      id: "relation-017",
      sourceId: "event-005",
      targetId: "entity-012",
    },
    {
      id: "relation-018",
      sourceId: "event-006",
      targetId: "entity-011",
    },
    {
      id: "relation-019",
      sourceId: "event-006",
      targetId: "entity-010",
    },
    {
      id: "relation-020",
      sourceId: "event-006",
      targetId: "entity-003",
    },
    {
      id: "relation-021",
      sourceId: "event-006",
      targetId: "entity-004",
    },
    {
      id: "relation-022",
      sourceId: "event-006",
      targetId: "entity-005",
    },
    {
      id: "relation-023",
      sourceId: "event-007",
      targetId: "entity-011",
    },
    {
      id: "relation-024",
      sourceId: "event-007",
      targetId: "entity-003",
    },
    {
      id: "relation-025",
      sourceId: "event-007",
      targetId: "entity-004",
    },
    {
      id: "relation-026",
      sourceId: "event-007",
      targetId: "entity-012",
    },
    {
      id: "relation-027",
      sourceId: "event-008",
      targetId: "entity-003",
    },
    {
      id: "relation-028",
      sourceId: "event-008",
      targetId: "entity-011",
    },
    {
      id: "relation-029",
      sourceId: "event-008",
      targetId: "entity-012",
    },
    {
      id: "relation-030",
      sourceId: "event-009",
      targetId: "entity-003",
    },
    {
      id: "relation-031",
      sourceId: "event-009",
      targetId: "entity-004",
    },
    {
      id: "relation-032",
      sourceId: "event-009",
      targetId: "entity-012",
    },
    {
      id: "relation-033",
      sourceId: "event-010",
      targetId: "entity-011",
    },
    {
      id: "relation-034",
      sourceId: "event-010",
      targetId: "entity-003",
    },
    {
      id: "relation-035",
      sourceId: "event-010",
      targetId: "entity-004",
    },
    {
      id: "relation-036",
      sourceId: "event-010",
      targetId: "entity-010",
    },
    {
      id: "relation-037",
      sourceId: "event-010",
      targetId: "entity-005",
    },
    {
      id: "relation-038",
      sourceId: "event-011",
      targetId: "entity-010",
    },
    {
      id: "relation-039",
      sourceId: "event-011",
      targetId: "entity-003",
    },
    {
      id: "relation-040",
      sourceId: "event-011",
      targetId: "entity-004",
    },
    {
      id: "relation-041",
      sourceId: "event-011",
      targetId: "entity-005",
    },
    {
      id: "relation-042",
      sourceId: "event-012",
      targetId: "entity-010",
    },
    {
      id: "relation-043",
      sourceId: "event-012",
      targetId: "entity-003",
    },
    {
      id: "relation-044",
      sourceId: "event-012",
      targetId: "entity-004",
    },
    {
      id: "relation-045",
      sourceId: "event-012",
      targetId: "entity-005",
    },
    {
      id: "relation-046",
      sourceId: "event-012",
      targetId: "entity-008",
    },
    {
      id: "relation-047",
      sourceId: "event-012",
      targetId: "entity-009",
    },
  ],
};
