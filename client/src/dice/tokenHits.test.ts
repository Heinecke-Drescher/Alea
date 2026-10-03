import { describe, expect, it } from "vitest";
import type { Token } from "../room/roomStore";
import { tokenHits } from "./tokenHits";

function token(id: string, x: number, y: number, size = 1): Token {
  return { id, name: id, imageId: `${id}-image`, x, y, size };
}

const DIE_RADIUS = 10;

describe("tokenHits", () => {
  it("finds where the die first touches a token on its way", () => {
    const [hit, ...rest] = tokenHits(
      [0, 75, 500, 75],
      [token("goblin", 4, 1)],
      DIE_RADIUS,
    );
    expect(rest).toEqual([]);
    expect(hit).toEqual({
      tokenId: "goblin",
      distance: 225 - 25 - DIE_RADIUS,
      direction: { x: 1, y: 0 },
    });
  });

  it("ignores tokens the die passes by", () => {
    expect(
      tokenHits([0, 75, 500, 75], [token("far", 4, 5)], DIE_RADIUS),
    ).toEqual([]);
  });

  it("counts the path after a bounce", () => {
    const [hit] = tokenHits(
      [0, 75, 500, 75, 100, 75],
      [token("behind", 3, 1)],
      DIE_RADIUS,
    );
    expect(hit?.direction).toEqual({ x: 1, y: 0 });
    expect(hit?.distance).toBe(175 - 25 - DIE_RADIUS);
  });

  it("knocks a token that sits where the die was dropped", () => {
    const [hit] = tokenHits(
      [75, 75, 300, 75],
      [token("under", 1, 1)],
      DIE_RADIUS,
    );
    expect(hit).toMatchObject({ tokenId: "under", distance: 0 });
  });

  it("does not knock anything when the die was not thrown", () => {
    expect(
      tokenHits([75, 75, 75, 75], [token("under", 1, 1)], DIE_RADIUS),
    ).toEqual([]);
  });

  it("uses the size of large tokens", () => {
    const [hit] = tokenHits(
      [0, 50, 500, 50],
      [token("ogre", 4, 1, 2)],
      DIE_RADIUS,
    );
    const centerX = 250;
    const reach = 50 + DIE_RADIUS;
    const offsetY = 100 - 50;
    expect(hit?.distance).toBeCloseTo(
      centerX - Math.sqrt(reach ** 2 - offsetY ** 2),
    );
  });
});
