import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { CELL_SIZE, DEFAULT_MAP_BOUNDS } from "./grid";
import { createRoom, type Room } from "./createRoom";
import { embeddedImage } from "./tokens";

const IMAGE = "data:image/webp;base64,AAAA";
const { columns, rows } = DEFAULT_MAP_BOUNDS;

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function tokenOf(id: string | undefined) {
  const token = id && room.tokensMap.get(id);
  if (!token) throw new Error(`Expected token ${id}`);
  return token;
}

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

describe("addToken", () => {
  it("stores the token together with its image", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const token = onlyToken();
    expect(token).toMatchObject({ name: "Goblin", x: 0, y: 0, size: 1 });
    expect(room.imagesMap.get(token.imageId)).toBe(IMAGE);
  });

  it("places a new token on the given cell and keeps it on the map", () => {
    room.addToken("Goblin", IMAGE, { x: 4, y: 2 });
    expect(onlyToken()).toMatchObject({ x: 4, y: 2, size: 1 });
    room.removeToken(onlyToken().id);
    room.addToken("Goblin", IMAGE, { x: columns + 3, y: -2 });
    expect(onlyToken()).toMatchObject({ x: columns - 1, y: 0 });
  });
});

describe("changing tokens", () => {
  it("replaces a token's image and removes the old one in a single undo step", () => {
    const NEW_IMAGE = "data:image/webp;base64,BBBB";
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    room.toggleEffect(onlyToken().id, "dead");
    const before = room.doc.toJSON();
    room.setTokenImage(onlyToken().id, NEW_IMAGE);
    expect(onlyToken()).toMatchObject({ name: "Goblin", effects: ["dead"] });
    expect(room.imagesMap.get(onlyToken().imageId)).toBe(NEW_IMAGE);
    expect(Array.from(room.imagesMap.values())).toEqual([NEW_IMAGE]);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("changes no image when the token is gone", () => {
    room.setTokenImage("missing", IMAGE);
    expect(room.imagesMap.size).toBe(0);
  });

  it("resizes a token to a new place and size in a single undo step", () => {
    room.addToken("Dragon", IMAGE, { x: 0, y: 0 });
    moveOnlyTokenTo(5, 5);
    const before = room.doc.toJSON();
    room.resizeToken(onlyToken().id, { x: 3, y: 4, size: 3 });
    expect(onlyToken()).toMatchObject({ x: 3, y: 4, size: 3 });
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("keeps a resized token inside the map", () => {
    room.addToken("Dragon", IMAGE, { x: 0, y: 0 });
    moveOnlyTokenTo(columns - 1, rows - 1);
    room.resizeToken(onlyToken().id, { ...onlyToken(), size: 3 });
    expect(onlyToken()).toMatchObject({
      size: 3,
      x: columns - 3,
      y: rows - 3,
    });
  });

  it("refuses token sizes it does not support", () => {
    room.addToken("Dragon", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    expect(() => room.resizeToken(id, { x: 0, y: 0, size: 0 })).toThrow();
    expect(() => room.resizeToken(id, { x: 0, y: 0, size: 11 })).toThrow();
    expect(() => room.resizeToken(id, { x: 0, y: 0, size: 1.5 })).toThrow();
  });

  it("removes a token and its image", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    room.removeToken(onlyToken().id);
    expect(room.tokensMap.size).toBe(0);
    expect(room.imagesMap.size).toBe(0);
  });

  it("ignores changes to tokens that no longer exist", () => {
    room.removeToken("gone");
    expect(room.tokensMap.size).toBe(0);
    expect(room.duplicateToken("gone")).toBeUndefined();
  });

  it("duplicates a token next to it with its own image", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const original = onlyToken();
    const copy = tokenOf(room.duplicateToken(original.id));
    expect(copy).toMatchObject({
      name: "Goblin",
      size: 1,
      x: original.x + 1,
      y: original.y,
    });
    expect(copy.imageId).not.toBe(original.imageId);
    expect(room.imagesMap.get(copy.imageId)).toBe(IMAGE);
  });

  it("undoes a duplicate in one step", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const before = room.doc.toJSON();
    room.duplicateToken(onlyToken().id);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("does not duplicate when the map has no free space", () => {
    room.resize({ x: 0, y: 0, columns: 10, rows: 10 });
    room.addToken("Tarrasque", IMAGE, { x: 0, y: 0 });
    room.resizeToken(onlyToken().id, { x: 0, y: 0, size: 10 });
    expect(room.duplicateToken(onlyToken().id)).toBeUndefined();
    expect(room.tokensMap.size).toBe(1);
  });

  it("duplicates next to blocked cells", () => {
    room.addToken("Goblin", IMAGE, { x: 5, y: 5 });
    const original = onlyToken();
    const copyId = room.duplicateToken(original.id, [{ x: 6, y: 5, size: 1 }]);
    expect(tokenOf(copyId)).toMatchObject({ x: 5, y: 6 });
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
