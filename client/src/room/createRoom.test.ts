import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { CELL_SIZE, COLUMNS, ROWS } from "../board/grid";
import { createRoom, embeddedImage, type Room } from "./createRoom";

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

describe("moveArea", () => {
  const cellArea = (x: number, y: number, width: number, height: number) => ({
    x: x * CELL_SIZE,
    y: y * CELL_SIZE,
    width: width * CELL_SIZE,
    height: height * CELL_SIZE,
  });

  it("moves the cells whose center is inside the area", () => {
    room.paintCell(1, 1, "#ff0000");
    room.paintCell(5, 5, "#00ff00");
    room.moveArea({ x: 40, y: 40, width: 40, height: 40 }, 2, 3);
    expect(Object.keys(room.cellsMap.toJSON()).sort()).toEqual(["3,4", "5,5"]);
  });

  it("paints over cells at the destination", () => {
    room.paintCell(1, 1, "#ff0000");
    room.paintCell(2, 1, "#00ff00");
    room.moveArea(cellArea(1, 1, 1, 1), 1, 0);
    expect(room.cellsMap.toJSON()).toEqual({
      "2,1": { x: 2, y: 1, color: "#ff0000" },
    });
  });

  it("moves tokens whose center is inside and keeps them on the map", () => {
    room.addToken("Dragon", IMAGE);
    const { id } = onlyToken();
    room.resizeToken(id, 3);
    room.moveArea(cellArea(1, 1, 1, 1), COLUMNS, 2);
    expect(onlyToken()).toMatchObject({ x: COLUMNS - 3, y: 2 });
  });

  it("moves every stroke that touches the area", () => {
    room.addStroke("#000000", [60, 60, 90, 90]);
    room.addStroke("#ff0000", [0, 75, 150, 75]);
    room.addStroke("#00ff00", [200, 200, 250, 250]);
    const [inner, crossing, outer] = room.strokesMap.keys();
    if (!inner || !crossing || !outer) throw new Error("Expected 3 strokes");
    room.moveArea(cellArea(1, 1, 1, 1), 1, 0);
    expect(room.strokesMap.get(inner)?.points).toEqual([110, 60, 140, 90]);
    expect(room.strokesMap.get(crossing)?.points).toEqual([50, 75, 200, 75]);
    expect(room.strokesMap.get(outer)?.points).toEqual([200, 200, 250, 250]);
  });

  it("is undone in a single step", () => {
    room.paintCell(1, 1, "#ff0000");
    room.addStroke("#000000", [0, 75, 150, 75]);
    room.addToken("Goblin", IMAGE);
    room.moveToken(onlyToken().id, 1, 1);
    const before = room.doc.toJSON();
    room.moveArea(cellArea(1, 1, 1, 1), 2, 2);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });
});

describe("moveStrokes", () => {
  it("moves only the given strokes by pixels", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    room.addStroke("#ff0000", [30, 30, 40, 40]);
    const [first, second] = room.strokesMap.keys();
    if (!first || !second) throw new Error("Expected two strokes");
    room.moveStrokes([first], 5, -3);
    expect(room.strokesMap.get(first)?.points).toEqual([15, 7, 25, 17]);
    expect(room.strokesMap.get(second)?.points).toEqual([30, 30, 40, 40]);
  });

  it("is undone in a single step", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    room.addStroke("#ff0000", [30, 30, 40, 40]);
    const before = room.doc.toJSON();
    room.moveStrokes(Array.from(room.strokesMap.keys()), 5, 5);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("skips strokes that were removed in the meantime", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    const [id] = room.strokesMap.keys();
    if (!id) throw new Error("Expected a stroke");
    room.moveStrokes([id, "gone"], 5, 5);
    expect(room.strokesMap.size).toBe(1);
    expect(room.strokesMap.get(id)?.points).toEqual([15, 15, 25, 25]);
  });
});

describe("copy, paste and delete", () => {
  const firstCell = { x: 0, y: 0, width: CELL_SIZE, height: CELL_SIZE };

  function fillFirstCell() {
    room.paintCell(0, 0, "#ff0000");
    room.addToken("Goblin", IMAGE);
    room.addStroke("#000000", [10, 10, 20, 20]);
  }

  it("pastes a copied area as new objects and keeps the original", () => {
    fillFirstCell();
    const original = onlyToken();
    const clip = room.copyArea(firstCell);
    const strokeIds = room.paste(clip, 2 * CELL_SIZE, CELL_SIZE);

    expect(room.cellsMap.get("2,1")).toEqual({ x: 2, y: 1, color: "#ff0000" });
    const copy = Array.from(room.tokensMap.values()).find(
      (token) => token.id !== original.id,
    );
    if (!copy) throw new Error("Expected a pasted token");
    expect(copy).toMatchObject({ name: "Goblin", x: 2, y: 1 });
    expect(copy.imageId).not.toBe(original.imageId);
    expect(room.imagesMap.get(copy.imageId)).toBe(IMAGE);
    const [strokeId, ...rest] = strokeIds;
    if (!strokeId) throw new Error("Expected a pasted stroke");
    expect(rest).toEqual([]);
    expect(room.strokesMap.get(strokeId)?.points).toEqual([110, 60, 120, 70]);
    expect(room.cellsMap.size).toBe(2);
    expect(room.tokensMap.size).toBe(2);
    expect(room.strokesMap.size).toBe(2);
  });

  it("pastes copied strokes by pixels", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    const [id] = room.strokesMap.keys();
    if (!id) throw new Error("Expected a stroke");
    const [copyId] = room.paste(room.copyStrokes([id]), 7, 3);
    if (!copyId) throw new Error("Expected a pasted stroke");
    expect(copyId).not.toBe(id);
    expect(room.strokesMap.get(copyId)?.points).toEqual([17, 13, 27, 23]);
  });

  it("refuses to paste cells off the grid", () => {
    room.paintCell(0, 0, "#ff0000");
    const clip = room.copyArea(firstCell);
    expect(() => room.paste(clip, 7, 0)).toThrow();
  });

  it("pastes in a single undo step", () => {
    fillFirstCell();
    const before = room.doc.toJSON();
    room.paste(room.copyArea(firstCell), CELL_SIZE, 0);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("deletes everything in an area in a single undo step", () => {
    fillFirstCell();
    const before = room.doc.toJSON();
    room.deleteArea(firstCell);
    expect(room.cellsMap.size).toBe(0);
    expect(room.tokensMap.size).toBe(0);
    expect(room.imagesMap.size).toBe(0);
    expect(room.strokesMap.size).toBe(0);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("deletes only the given strokes", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    room.addStroke("#ff0000", [30, 30, 40, 40]);
    const [first] = room.strokesMap.keys();
    if (!first) throw new Error("Expected a stroke");
    room.deleteStrokes([first]);
    expect(room.strokesMap.size).toBe(1);
    expect(room.strokesMap.has(first)).toBe(false);
  });
});

describe("undo and redo", () => {
  it("undoes and redoes a painted cell", () => {
    room.paintCell(2, 3, "#ff0000");
    room.undoManager.undo();
    expect(room.cellsMap.size).toBe(0);
    room.undoManager.redo();
    expect(room.cellsMap.get("2,3")).toMatchObject({ color: "#ff0000" });
  });

  it("brings back a removed token together with its image", () => {
    room.addToken("Goblin", IMAGE);
    const token = onlyToken();
    room.removeToken(token.id);
    room.undoManager.undo();
    expect(onlyToken()).toEqual(token);
    expect(room.imagesMap.get(token.imageId)).toBe(IMAGE);
  });

  it("undoes quickly drawn strokes one at a time", () => {
    room.addStroke("#000000", [0, 0, 10, 10]);
    room.addStroke("#000000", [20, 20, 30, 30]);
    room.undoManager.undo();
    expect(Array.from(room.strokesMap.values())).toMatchObject([
      { points: [0, 0, 10, 10] },
    ]);
  });

  it("does not undo changes from other players", () => {
    const other = createRoom(new Y.Doc());
    other.paintCell(1, 1, "#00ff00");
    Y.applyUpdate(room.doc, Y.encodeStateAsUpdate(other.doc), "remote");
    room.undoManager.undo();
    expect(room.cellsMap.size).toBe(1);
  });

  it("does not bring back a token another player removed", () => {
    const other = createRoom(new Y.Doc());
    const sync = (from: Room, to: Room) =>
      Y.applyUpdate(to.doc, Y.encodeStateAsUpdate(from.doc), "remote");
    room.addToken("Goblin", IMAGE);
    room.moveToken(onlyToken().id, 5, 5);
    sync(room, other);
    other.removeToken(onlyToken().id);
    sync(other, room);
    room.undoManager.undo();
    expect(room.tokensMap.size).toBe(0);
    room.undoManager.redo();
    expect(room.tokensMap.size).toBe(0);
    sync(room, other);
    expect(other.tokensMap.size).toBe(0);
  });

  it("does not undo rolls", () => {
    room.addRoll("Anna", 20, 17);
    room.undoManager.undo();
    expect(room.rollsArray.length).toBe(1);
  });
});

describe("embeddedImage", () => {
  it("accepts embedded images", () => {
    expect(embeddedImage(IMAGE)).toBe(IMAGE);
  });

  it.each([
    undefined,
    "",
    "https://tracker.example/pixel.png",
    "data:text/html,x",
  ])("rejects %j", (value) => {
    expect(embeddedImage(value)).toBeNull();
  });
});

describe("rooms", () => {
  it("keeps the documents of different rooms separate", () => {
    const other = createRoom(new Y.Doc());
    room.addToken("Goblin", IMAGE);
    expect(other.tokensMap.size).toBe(0);
  });
});
