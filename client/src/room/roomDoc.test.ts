import { beforeEach, describe, expect, it } from "vitest";
import { COLUMNS, ROWS } from "../board/grid";
import {
  addToken,
  imagesMap,
  moveToken,
  removeToken,
  resizeToken,
  roomDoc,
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
