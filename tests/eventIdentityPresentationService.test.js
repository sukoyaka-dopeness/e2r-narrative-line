import assert from "node:assert/strict";
import test from "node:test";
import { resolveEventIdentityPresentations } from "../src/services/EventIdentityPresentationService.ts";

function event(id, name, chronology, temporalOrder) {
  return {
    id,
    ...(name === undefined ? {} : { name }),
    ...(chronology === undefined
      ? {}
      : { extensions: { history: { time: { chronology, temporalOrder } } } }),
  };
}

function resolve(events) {
  return resolveEventIdentityPresentations(events, {
    getPrimary: (current) => current.name ?? "(Unnamed Event)",
    getChronology: (current) => {
      const chronology = current.extensions?.history?.time?.chronology;
      return chronology === undefined
        ? undefined
        : { key: chronology, label: chronology };
    },
  });
}

test("R1 unique primary name has no short-ID hint", () => {
  const result = resolve([event("event-unique", "Inspection", "2026-08-28")]);
  assert.deepEqual(result.get("event-unique"), {
    eventId: "event-unique",
    primary: "Inspection",
    ambiguousPrimary: false,
    chronologyHint: "2026-08-28",
    needsShortId: false,
  });
});

test("R2 duplicate names with distinct chronology are resolved by chronology", () => {
  const result = resolve([
    event("event-morning", "Inspection", "2026-08-28 09:00"),
    event("event-evening", "Inspection", "2026-08-28 18:00"),
  ]);
  assert.equal(result.get("event-morning")?.ambiguousPrimary, true);
  assert.equal(result.get("event-morning")?.chronologyHint, "2026-08-28 09:00");
  assert.equal(result.get("event-evening")?.needsShortId, false);
});

test("R3 duplicate names with equal chronology require short-ID fallback", () => {
  const result = resolve([
    event("event-123456A", "Inspection", "2026-08-28"),
    event("event-123456B", "Inspection", "2026-08-28"),
  ]);
  assert.equal(result.get("event-123456A")?.needsShortId, true);
  assert.equal(result.get("event-123456B")?.needsShortId, true);
  assert.notEqual(result.get("event-123456A")?.shortIdHint, result.get("event-123456B")?.shortIdHint);
});

test("R4 duplicate names without chronology require short-ID fallback", () => {
  const result = resolve([
    event("event-no-time-A", "Inspection"),
    event("event-no-time-B", "Inspection"),
  ]);
  assert.equal(result.get("event-no-time-A")?.needsShortId, true);
  assert.equal(result.get("event-no-time-B")?.needsShortId, true);
});

test("R5 each duplicate result is determined from the supplied candidate set", () => {
  const result = resolve([
    event("event-one", "Inspection", "2026"),
    event("event-two", "Inspection", "2027"),
    event("event-three", "Inspection", "2028"),
  ]);
  assert.equal([...result.values()].every((value) => value.ambiguousPrimary), true);
  assert.equal([...result.values()].every((value) => !value.needsShortId), true);
});

test("R6 short-ID prefixes extend to resolve a collision", () => {
  const result = resolve([
    event("abcdefgh-first", "Inspection", "2026-08-28"),
    event("abcdefgh-second", "Inspection", "2026-08-28"),
  ]);
  assert.equal(result.get("abcdefgh-first")?.shortIdHint, "abcdefgh-f");
  assert.equal(result.get("abcdefgh-second")?.shortIdHint, "abcdefgh-s");
  assert.notEqual(result.get("abcdefgh-first")?.shortIdHint, result.get("abcdefgh-second")?.shortIdHint);
});

test("R7 an Event outside the candidate set has no effect", () => {
  const result = resolve([
    event("event-visible", "Inspection", "2026-08-28"),
  ]);
  assert.equal(result.size, 1);
  assert.equal(result.get("event-visible")?.ambiguousPrimary, false);
  assert.equal(result.get("event-visible")?.needsShortId, false);
});

test("R8 null name preserves the supplied fallback", () => {
  const result = resolve([event("event-unnamed", undefined)]);
  assert.equal(result.get("event-unnamed")?.primary, "(Unnamed Event)");
  assert.equal(result.get("event-unnamed")?.needsShortId, false);
});

test("R9 primary identity does not trim or fold case", () => {
  const result = resolve([
    event("event-spaced", " Inspection "),
    event("event-lower", "inspection"),
  ]);
  assert.equal(result.get("event-spaced")?.ambiguousPrimary, false);
  assert.equal(result.get("event-lower")?.ambiguousPrimary, false);
});

test("R10 temporalOrder alone does not remove identity ambiguity", () => {
  const result = resolve([
    event("event-order-one", "Inspection", "2026-08-28", 1),
    event("event-order-two", "Inspection", "2026-08-28", 2),
  ]);
  assert.equal(result.get("event-order-one")?.needsShortId, true);
  assert.equal(result.get("event-order-two")?.needsShortId, true);
  assert.equal("temporalOrder" in (result.get("event-order-one") ?? {}), false);
});

test("R11 canonical Event IDs remain separate from display hints", () => {
  const result = resolve([
    event("event-canonical-123456", "Inspection", "2026-08-28"),
    event("event-canonical-abcdef", "Inspection", "2026-08-28"),
  ]);
  const presentation = result.get("event-canonical-123456");
  assert.equal(presentation?.eventId, "event-canonical-123456");
  assert.notEqual(presentation?.eventId, presentation?.shortIdHint);
});
