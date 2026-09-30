import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { COLUMNS, ROWS } from "../board/grid";
import { createRoom, type Room } from "./createRoom";

const IMAGE = "data:image/webp;base64,AAAA";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function onlyToken() {
  const [token] = room.tokensMap.values();
  if (!token) throw new Error("Expected a token");
  return token;
}

describe("drawing", () => {
  it("paints and erases cells", () => {
    room.paintCell(2, 3, "#ff0000");
    room.paintCell(2, 3, "#00ff00");
    expect(Array.from(room.cellsMap.values())).toEqual([
      { x: 2, y: 3, color: "#00ff00" },
    ]);
    room.eraseCell(2, 3);
    expect(room.cellsMap.size).toBe(0);
  });

  it("adds and removes strokes", () => {
    room.addStroke("#000000", [0, 0, 10, 10]);
    const [stroke] = room.strokesMap.values();
    if (!stroke) throw new Error("Expected a stroke");
    expect(stroke).toMatchObject({ color: "#000000", points: [0, 0, 10, 10] });
    room.removeStroke(stroke.id);
    expect(room.strokesMap.size).toBe(0);
  });

  it("clears drawings but keeps tokens", () => {
    room.paintCell(1, 1, "#ff0000");
    room.addStroke("#000000", [0, 0, 10, 10]);
    room.addToken("Goblin", IMAGE);
    room.clearDrawings();
    expect(room.cellsMap.size).toBe(0);
    expect(room.strokesMap.size).toBe(0);
    expect(room.tokensMap.size).toBe(1);
  });
});

describe("addToken", () => {
  it("stores the token together with its image", () => {
    room.addToken("Goblin", IMAGE);
    const token = onlyToken();
    expect(token).toMatchObject({ name: "Goblin", x: 0, y: 0, size: 1 });
    expect(room.imagesMap.get(token.imageId)).toBe(IMAGE);
  });

  it("places new tokens on the next free cell", () => {
    room.addToken("A", IMAGE);
    room.addToken("B", IMAGE);
    const positions = Array.from(room.tokensMap.values(), (t) => [t.x, t.y]);
    expect(positions).toEqual(
      expect.arrayContaining([
        [0, 0],
        [1, 0],
      ]),
    );
  });

  it("does not place new tokens on cells covered by a large token", () => {
    room.addToken("Dragon", IMAGE);
    room.resizeToken(onlyToken().id, 3);
    room.addToken("Goblin", IMAGE);
    const goblin = Array.from(room.tokensMap.values()).find(
      (token) => token.name === "Goblin",
    );
    expect(goblin).toMatchObject({ x: 3, y: 0 });
  });

  it("fails when the map is full", () => {
    for (let i = 0; i < COLUMNS * ROWS; i++) room.addToken("Crowd", IMAGE);
    expect(() => room.addToken("One too many", IMAGE)).toThrow();
  });
});

describe("changing tokens", () => {
  it("moves a token", () => {
    room.addToken("Goblin", IMAGE);
    room.moveToken(onlyToken().id, 5, 7);
    expect(onlyToken()).toMatchObject({ x: 5, y: 7 });
  });

  it("keeps a resized token inside the map", () => {
    room.addToken("Dragon", IMAGE);
    const { id } = onlyToken();
    room.moveToken(id, COLUMNS - 1, ROWS - 1);
    room.resizeToken(id, 3);
    expect(onlyToken()).toMatchObject({
      size: 3,
      x: COLUMNS - 3,
      y: ROWS - 3,
    });
  });

  it("removes a token and its image", () => {
    room.addToken("Goblin", IMAGE);
    room.removeToken(onlyToken().id);
    expect(room.tokensMap.size).toBe(0);
    expect(room.imagesMap.size).toBe(0);
  });

  it("ignores changes to tokens that no longer exist", () => {
    room.moveToken("gone", 1, 1);
    room.removeToken("gone");
    expect(room.tokensMap.size).toBe(0);
  });
});

describe("rolls", () => {
  it("records who rolled what", () => {
    room.addRoll("Anna", 20, 17);
    expect(room.rollsArray.toArray()).toMatchObject([
      { player: "Anna", sides: 20, value: 17 },
    ]);
  });

  it("keeps only the latest 50 rolls", () => {
    for (let value = 1; value <= 60; value++) room.addRoll("Anna", 100, value);
    const rolls = room.rollsArray.toArray();
    expect(rolls).toHaveLength(50);
    expect(rolls[0]?.value).toBe(11);
    expect(rolls.at(-1)?.value).toBe(60);
  });
});

describe("rooms", () => {
  it("keeps the documents of different rooms separate", () => {
    const other = createRoom(new Y.Doc());
    room.addToken("Goblin", IMAGE);
    expect(other.tokensMap.size).toBe(0);
  });
});
