import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRoomStorage } from "./roomStorage.ts";

const ROOM_ID = "abc123def456";
const MAX_BYTES = 8;

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "alea-rooms-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true });
});

async function loadedBytes(
  storage: ReturnType<typeof createRoomStorage>,
  roomId: string,
) {
  const loaded = await storage.load(roomId);
  if (!loaded) throw new Error("Expected saved data");
  return Array.from(loaded);
}

describe("roomStorage", () => {
  it("returns null for a room that was never saved", async () => {
    const storage = createRoomStorage(directory, MAX_BYTES);
    expect(await storage.load(ROOM_ID)).toBeNull();
  });

  it("loads what was saved", async () => {
    const storage = createRoomStorage(directory, MAX_BYTES);
    await storage.save(ROOM_ID, new Uint8Array([1, 2, 3]));
    expect(await loadedBytes(storage, ROOM_ID)).toEqual([1, 2, 3]);
  });

  it("creates the directory when it does not exist yet", async () => {
    const storage = createRoomStorage(
      path.join(directory, "nested", "rooms"),
      MAX_BYTES,
    );
    await storage.save(ROOM_ID, new Uint8Array([7]));
    expect(await loadedBytes(storage, ROOM_ID)).toEqual([7]);
  });

  it("keeps overlapping saves of one room in order", async () => {
    const storage = createRoomStorage(directory, MAX_BYTES);
    await Promise.all([
      storage.save(ROOM_ID, new Uint8Array([1])),
      storage.save(ROOM_ID, new Uint8Array([2])),
      storage.save(ROOM_ID, new Uint8Array([3])),
    ]);
    expect(await loadedBytes(storage, ROOM_ID)).toEqual([3]);
  });

  it("saves a room of exactly the maximum size", async () => {
    const storage = createRoomStorage(directory, MAX_BYTES);
    const state = new Uint8Array(MAX_BYTES).fill(1);
    expect(await storage.save(ROOM_ID, state)).toBe(true);
    expect(await loadedBytes(storage, ROOM_ID)).toEqual(Array.from(state));
  });

  it("refuses a larger room and keeps the last saved state", async () => {
    const storage = createRoomStorage(directory, MAX_BYTES);
    await storage.save(ROOM_ID, new Uint8Array([1, 2, 3]));
    expect(await storage.save(ROOM_ID, new Uint8Array(MAX_BYTES + 1))).toBe(
      false,
    );
    expect(await loadedBytes(storage, ROOM_ID)).toEqual([1, 2, 3]);
  });

  it.each(["../escape1234", "ABCDEFGHIJKL", "a/b", "", "abc"])(
    "rejects the room id %j",
    async (roomId) => {
      const storage = createRoomStorage(directory, MAX_BYTES);
      await expect(storage.load(roomId)).rejects.toThrow("Invalid room id");
      await expect(storage.save(roomId, new Uint8Array())).rejects.toThrow(
        "Invalid room id",
      );
    },
  );
});
