import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { rollColor, rollPath } from "./rolls";

const SPOT = { x: 120, y: 80 };

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

describe("rolls", () => {
  it("records who rolled what and where", () => {
    room.addRoll("Anna", "teal", 20, 17, SPOT);
    expect(room.rollsArray.toArray()).toMatchObject([
      {
        player: "Anna",
        color: "teal",
        sides: 20,
        value: 17,
        position: SPOT,
      },
    ]);
  });

  it("records a clicked roll without a position or path", () => {
    room.addRoll("Anna", "teal", 6, 4);
    const [roll] = room.rollsArray.toArray();
    expect(roll).toMatchObject({ player: "Anna", sides: 6, value: 4 });
    expect(roll).not.toHaveProperty("position");
    expect(roll).not.toHaveProperty("path");
  });

  it("records the path of a dragged roll", () => {
    room.addRoll("Anna", "teal", 6, 4, SPOT, [0, 0, 120, 80]);
    expect(room.rollsArray.get(0)).toMatchObject({
      position: SPOT,
      path: [0, 0, 120, 80],
    });
  });

  const someRoll = {
    id: "r",
    player: "Anna",
    sides: 6,
    value: 4,
    at: 0,
  } as const;

  it("shows rolls without a valid color in gray", () => {
    expect(rollColor({ ...someRoll, color: "teal" })).toBe("teal");
    expect(rollColor(someRoll)).toBe("gray");
    expect(rollColor({ ...someRoll, color: "#ff0000" as never })).toBe("gray");
  });

  it("only accepts well-formed paths", () => {
    expect(rollPath({ ...someRoll, path: [0, 0, 10, 20] })).toEqual([
      0, 0, 10, 20,
    ]);
    expect(rollPath(someRoll)).toBeNull();
    expect(rollPath({ ...someRoll, path: [0, 0] })).toBeNull();
    expect(rollPath({ ...someRoll, path: [0, 0, 10] })).toBeNull();
    expect(rollPath({ ...someRoll, path: [0, 0, NaN, 1] })).toBeNull();
    expect(rollPath({ ...someRoll, path: new Array(40).fill(1) })).toBeNull();
    expect(rollPath({ ...someRoll, path: "0,0,1,1" as never })).toBeNull();
  });

  it("keeps only the latest 50 rolls", () => {
    for (let value = 1; value <= 60; value++)
      room.addRoll("Anna", "teal", 100, value, SPOT);
    const rolls = room.rollsArray.toArray();
    expect(rolls).toHaveLength(50);
    expect(rolls[0]?.value).toBe(11);
    expect(rolls.at(-1)?.value).toBe(60);
  });
});
