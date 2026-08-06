import type { Dataset } from "../models/Dataset";

function createUuidV7(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  let timestamp = Date.now();

  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hexadecimal = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  );

  return [
    hexadecimal.slice(0, 4).join(""),
    hexadecimal.slice(4, 6).join(""),
    hexadecimal.slice(6, 8).join(""),
    hexadecimal.slice(8, 10).join(""),
    hexadecimal.slice(10, 16).join(""),
  ].join("-");
}

function containsId(dataset: Dataset, objectId: string): boolean {
  return (
    dataset.events.some((event) => event.id === objectId) ||
    dataset.entities.some((entity) => entity.id === objectId) ||
    dataset.relations.some((relation) => relation.id === objectId)
  );
}

export function createDatasetId(): string {
  return createUuidV7();
}

export function createCoreObjectId(dataset: Dataset): string {
  let objectId = createUuidV7();

  while (containsId(dataset, objectId)) {
    objectId = createUuidV7();
  }

  return objectId;
}
