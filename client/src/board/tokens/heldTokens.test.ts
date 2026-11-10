import { describe, expect, it } from "vitest";
import { heldTokensClip } from "./heldTokens";

const IMAGE = "data:image/webp;base64,AAAA";

function positions(count: number) {
  const tokens = Array.from({ length: count }, (_, i) => ({
    name: `Goblin ${i + 1}`,
    imageDataUrl: IMAGE,
  }));
  return heldTokensClip(tokens).tokens.map(({ x, y }) => [x, y]);
}

describe("heldTokensClip", () => {
  it("holds a single token on its own", () => {
    expect(positions(1)).toEqual([[0, 0]]);
  });

  it("arranges tokens in a block as square as possible", () => {
    expect(positions(5)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ]);
    expect(positions(4)).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]);
  });

  it("keeps each token's name and image as a plain new token", () => {
    const [token] = heldTokensClip([
      { name: "Ogre", imageDataUrl: IMAGE },
    ]).tokens;
    expect(token).toEqual({
      name: "Ogre",
      image: IMAGE,
      x: 0,
      y: 0,
      size: 1,
      effects: [],
    });
  });
});
