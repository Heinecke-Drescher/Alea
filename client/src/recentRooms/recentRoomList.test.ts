import { describe, expect, it } from "vitest";
import {
  MAX_RECENT_ROOMS,
  NO_RECENT_ROOMS,
  parseRecentRooms,
  removeRoom,
  visitRoom,
} from "./recentRoomList";

const FIRST = "aaaaaaaaaaaa";
const SECOND = "bbbbbbbbbbbb";

function roomId(index: number) {
  return index.toString(36).padStart(12, "0");
}

describe("visitRoom", () => {
  it("gives a new room the next number and puts it on top", () => {
    const once = visitRoom(NO_RECENT_ROOMS, FIRST, 100);
    const twice = visitRoom(once, SECOND, 200);
    expect(twice).toEqual({
      nextNumber: 3,
      rooms: [
        { id: SECOND, number: 2, visitedAt: 200 },
        { id: FIRST, number: 1, visitedAt: 100 },
      ],
    });
  });

  it("keeps the number of a known room and moves it up with the new date", () => {
    const recent = visitRoom(
      visitRoom(NO_RECENT_ROOMS, FIRST, 100),
      SECOND,
      200,
    );
    expect(visitRoom(recent, FIRST, 300)).toEqual({
      nextNumber: 3,
      rooms: [
        { id: FIRST, number: 1, visitedAt: 300 },
        { id: SECOND, number: 2, visitedAt: 200 },
      ],
    });
  });

  it("drops the room visited longest ago beyond the limit", () => {
    let recent = NO_RECENT_ROOMS;
    for (let index = 0; index <= MAX_RECENT_ROOMS; index++) {
      recent = visitRoom(recent, roomId(index), index);
    }
    expect(recent.rooms).toHaveLength(MAX_RECENT_ROOMS);
    expect(recent.rooms.map((room) => room.id)).not.toContain(roomId(0));
  });
});

describe("removeRoom", () => {
  it("never gives a removed number out again", () => {
    const recent = removeRoom(visitRoom(NO_RECENT_ROOMS, FIRST, 100), FIRST);
    expect(recent.rooms).toEqual([]);
    expect(visitRoom(recent, SECOND, 200).rooms[0]?.number).toBe(2);
  });
});

describe("parseRecentRooms", () => {
  it("reads what was stored", () => {
    const recent = visitRoom(NO_RECENT_ROOMS, FIRST, 100);
    expect(parseRecentRooms(JSON.stringify(recent))).toEqual(recent);
  });

  it("starts an empty list without or with unreadable data", () => {
    expect(parseRecentRooms(undefined)).toEqual(NO_RECENT_ROOMS);
    expect(parseRecentRooms("{broken")).toEqual(NO_RECENT_ROOMS);
    expect(parseRecentRooms('"text"')).toEqual(NO_RECENT_ROOMS);
  });

  it("skips invalid rooms and never reuses a stored number", () => {
    const stored = {
      nextNumber: 1,
      rooms: [
        { id: FIRST, number: 4, visitedAt: 100 },
        { id: "../etc", number: 5, visitedAt: 100 },
        { id: SECOND, number: 0, visitedAt: 100 },
        { id: SECOND, number: 2, visitedAt: "today" },
        { id: SECOND, number: 2, visitedAt: 1e20 },
        { id: SECOND, number: 1e300, visitedAt: 100 },
      ],
    };
    expect(parseRecentRooms(JSON.stringify(stored))).toEqual({
      nextNumber: 5,
      rooms: [{ id: FIRST, number: 4, visitedAt: 100 }],
    });
  });

  it("ignores a stored next number that can no longer count up", () => {
    const stored = { nextNumber: 1e300, rooms: [] };
    expect(parseRecentRooms(JSON.stringify(stored)).nextNumber).toBe(1);
  });

  it("keeps only the first entry of a room stored twice", () => {
    const stored = {
      nextNumber: 3,
      rooms: [
        { id: FIRST, number: 1, visitedAt: 200 },
        { id: FIRST, number: 2, visitedAt: 100 },
      ],
    };
    expect(parseRecentRooms(JSON.stringify(stored)).rooms).toEqual([
      { id: FIRST, number: 1, visitedAt: 200 },
    ]);
  });
});
