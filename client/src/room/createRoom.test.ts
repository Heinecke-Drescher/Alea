import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { CELL_SIZE } from "./grid";
import { createRoom, type Room } from "./createRoom";

const IMAGE = "data:image/webp;base64,AAAA";
const SPOT = { x: 120, y: 80 };

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function onlyToken() {
  const [token] = room.tokensMap.values();
  if (!token) throw new Error("Expected a token");
  return token;
}

function moveOnlyTokenTo(x: number, y: number) {
  const token = onlyToken();
  room.moveItems(
    { strokes: [], tokens: [token.id], texts: [] },
    (x - token.x) * CELL_SIZE,
    (y - token.y) * CELL_SIZE,
  );
}

describe("undo and redo", () => {
  it("undoes and redoes a painted cell", () => {
    room.paintCell(2, 3, "#ff0000");
    room.undoManager.undo();
    expect(room.cellsMap.size).toBe(0);
    room.undoManager.redo();
    expect(room.cellsMap.get("2,3")).toMatchObject({ color: "#ff0000" });
  });

  it("brings back a removed token together with its image", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
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
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    moveOnlyTokenTo(5, 5);
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
    room.addRoll("Anna", "teal", 20, 17, SPOT);
    room.undoManager.undo();
    expect(room.rollsArray.length).toBe(1);
  });
});

describe("rooms", () => {
  it("keeps the documents of different rooms separate", () => {
    const other = createRoom(new Y.Doc());
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    expect(other.tokensMap.size).toBe(0);
  });
});
