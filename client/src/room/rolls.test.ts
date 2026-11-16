import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { rollColor, rollPath, validRoll } from "./rolls";

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
    const shownColor = (roll: unknown) => {
      const valid = validRoll(roll);
      if (!valid) throw new Error("Expected a valid roll");
      return rollColor(valid);
    };
    expect(shownColor({ ...someRoll, color: "teal" })).toBe("teal");
    expect(shownColor(someRoll)).toBe("gray");
    expect(shownColor({ ...someRoll, color: "#ff0000" })).toBe("gray");
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
    expect(rollPath({ ...someRoll, path: "0,0,1,1" })).toBeNull();
  });

  it("keeps only the latest 50 rolls", () => {
    for (let value = 1; value <= 60; value++)
      room.addRoll("Anna", "teal", 100, value, SPOT);
    const rolls = room.rollsArray
      .toArray()
      .flatMap((roll) => validRoll(roll) ?? []);
    expect(rolls).toHaveLength(50);
    expect(rolls[0]?.value).toBe(11);
    expect(rolls.at(-1)?.value).toBe(60);
  });
});

describe("rolls from other players", () => {
  const ROLL = { id: "r", player: "Anna", sides: 20, value: 17, at: 5 };

  it("keeps only the known fields of a roll", () => {
    const roll = { ...ROLL, color: "teal", position: SPOT, extra: 1 };
    expect(validRoll(roll)).toEqual({ ...ROLL, color: "teal", position: SPOT });
  });

  it("leaves out a broken color, path or landing place but keeps the roll", () => {
    const roll = { ...ROLL, color: "#f00", path: [0, 0], position: { x: "1" } };
    expect(validRoll(roll)).toEqual(ROLL);
  });

  it.each<[string, unknown]>([
    ["no object", 17],
    ["no id", { ...ROLL, id: undefined }],
    ["a player that is no text", { ...ROLL, player: { name: "Anna" } }],
    ["a die we do not offer", { ...ROLL, sides: 7 }],
    ["a result of zero", { ...ROLL, value: 0 }],
    ["a result above the die", { ...ROLL, value: 21 }],
    ["a result between numbers", { ...ROLL, value: 1.5 }],
    ["a time that is no number", { ...ROLL, at: "now" }],
  ])("rejects %s", (_, value) => {
    expect(validRoll(value)).toBeNull();
  });
});
