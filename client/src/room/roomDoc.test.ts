import { beforeEach, describe, expect, it } from "vitest";
import { COLUMNS, ROWS } from "../board/grid";
import {
  addStroke,
  addToken,
  cellsMap,
  clearDrawings,
  eraseCell,
  imagesMap,
  moveToken,
  paintCell,
  removeStroke,
  removeToken,
  resizeToken,
  roomDoc,
  strokesMap,
  tokensMap,
} from "./roomDoc";

const IMAGE = "data:image/webp;base64,AAAA";

function onlyToken() {
  const [token] = tokensMap.values();
  if (!token) throw new Error("Expected a token");
  return token;
}

beforeEach(() => {
  roomDoc.transact(() => {
    tokensMap.clear();
    imagesMap.clear();
    cellsMap.clear();
    strokesMap.clear();
  });
});

describe("drawing", () => {
  it("paints and erases cells", () => {
    paintCell(2, 3, "#ff0000");
    paintCell(2, 3, "#00ff00");
    expect(Array.from(cellsMap.values())).toEqual([
      { x: 2, y: 3, color: "#00ff00" },
    ]);
    eraseCell(2, 3);
    expect(cellsMap.size).toBe(0);
  });

  it("adds and removes strokes", () => {
    addStroke("#000000", [0, 0, 10, 10]);
    const [stroke] = strokesMap.values();
    if (!stroke) throw new Error("Expected a stroke");
    expect(stroke).toMatchObject({ color: "#000000", points: [0, 0, 10, 10] });
    removeStroke(stroke.id);
    expect(strokesMap.size).toBe(0);
  });

  it("clears drawings but keeps tokens", () => {
    paintCell(1, 1, "#ff0000");
    addStroke("#000000", [0, 0, 10, 10]);
    addToken("Goblin", IMAGE);
    clearDrawings();
    expect(cellsMap.size).toBe(0);
    expect(strokesMap.size).toBe(0);
    expect(tokensMap.size).toBe(1);
  });
});

describe("addToken", () => {
  it("stores the token together with its image", () => {
    addToken("Goblin", IMAGE);
    const token = onlyToken();
    expect(token).toMatchObject({ name: "Goblin", x: 0, y: 0, size: 1 });
    expect(imagesMap.get(token.imageId)).toBe(IMAGE);
  });

  it("places new tokens on the next free cell", () => {
    addToken("A", IMAGE);
    addToken("B", IMAGE);
    const positions = Array.from(tokensMap.values(), (t) => [t.x, t.y]);
    expect(positions).toEqual(
      expect.arrayContaining([
        [0, 0],
        [1, 0],
      ]),
    );
  });

  it("does not place new tokens on cells covered by a large token", () => {
    addToken("Dragon", IMAGE);
    resizeToken(onlyToken().id, 3);
    addToken("Goblin", IMAGE);
    const goblin = Array.from(tokensMap.values()).find(
      (token) => token.name === "Goblin",
    );
    expect(goblin).toMatchObject({ x: 3, y: 0 });
  });

  it("fails when the map is full", () => {
    for (let i = 0; i < COLUMNS * ROWS; i++) addToken("Crowd", IMAGE);
    expect(() => addToken("One too many", IMAGE)).toThrow();
  });
});

describe("changing tokens", () => {
  it("moves a token", () => {
    addToken("Goblin", IMAGE);
    moveToken(onlyToken().id, 5, 7);
    expect(onlyToken()).toMatchObject({ x: 5, y: 7 });
  });

  it("keeps a resized token inside the map", () => {
    addToken("Dragon", IMAGE);
    const { id } = onlyToken();
    moveToken(id, COLUMNS - 1, ROWS - 1);
    resizeToken(id, 3);
    expect(onlyToken()).toMatchObject({
      size: 3,
      x: COLUMNS - 3,
      y: ROWS - 3,
    });
  });

  it("removes a token and its image", () => {
    addToken("Goblin", IMAGE);
    removeToken(onlyToken().id);
    expect(tokensMap.size).toBe(0);
    expect(imagesMap.size).toBe(0);
  });

  it("ignores changes to tokens that no longer exist", () => {
    moveToken("gone", 1, 1);
    removeToken("gone");
    expect(tokensMap.size).toBe(0);
  });
});
