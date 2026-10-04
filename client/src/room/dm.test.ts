import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { DM_KEY, validDm } from "./dm";
import { toPlayerId } from "./playerId";

const ANNA = { playerId: "anna-id", name: "Anna" };
const BEN = { playerId: "ben-id", name: "Ben" };

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

describe("DM role", () => {
  it("has no DM until someone takes the role", () => {
    expect(validDm(room.rolesMap.get(DM_KEY))).toBeNull();
    room.becomeDm(ANNA);
    expect(validDm(room.rolesMap.get(DM_KEY))).toEqual(ANNA);
  });

  it("lets another player take over", () => {
    room.becomeDm(ANNA);
    room.becomeDm(BEN);
    expect(validDm(room.rolesMap.get(DM_KEY))).toEqual(BEN);
  });

  it("lets only the DM release the role", () => {
    room.becomeDm(ANNA);
    expect(() => room.releaseDm(BEN.playerId)).toThrow();
    room.releaseDm(ANNA.playerId);
    expect(room.rolesMap.has(DM_KEY)).toBe(false);
  });

  it("is not part of undo", () => {
    room.becomeDm(ANNA);
    room.undoManager.undo();
    expect(validDm(room.rolesMap.get(DM_KEY))).toEqual(ANNA);
  });

  it("agrees on one DM when two players take the role at once", () => {
    const other = createRoom(new Y.Doc());
    room.becomeDm(ANNA);
    other.becomeDm(BEN);
    Y.applyUpdate(other.doc, Y.encodeStateAsUpdate(room.doc));
    Y.applyUpdate(room.doc, Y.encodeStateAsUpdate(other.doc));
    expect(room.rolesMap.get(DM_KEY)).toEqual(other.rolesMap.get(DM_KEY));
  });
});

describe("validDm", () => {
  it("rejects malformed entries", () => {
    expect(validDm(undefined)).toBeNull();
    expect(validDm({ playerId: "", name: "Anna" })).toBeNull();
    expect(validDm({ playerId: 7, name: "Anna" })).toBeNull();
    expect(validDm({ playerId: "anna-id" })).toBeNull();
  });
});

describe("toPlayerId", () => {
  it("reads the player id from another player's state", () => {
    expect(toPlayerId(1, { playerId: "anna-id", name: "Anna" })).toBe(
      "anna-id",
    );
  });

  it("ignores states without a player id", () => {
    expect(toPlayerId(1, { name: "Anna" })).toBeNull();
    expect(toPlayerId(1, { playerId: 7 })).toBeNull();
    expect(toPlayerId(1, null)).toBeNull();
  });
});
