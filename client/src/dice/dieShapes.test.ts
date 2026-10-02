import { describe, expect, it } from "vitest";
import { DIE_SIDES } from "../../../shared/dice";
import { dieShape } from "./dieShapes";

describe("dieShape", () => {
  it.each([
    [4, 3],
    [6, 4],
    [8, 4],
    [10, 4],
    [12, 5],
    [20, 6],
    [100, 4],
  ] as const)("draws a d%d with %d corners", (sides, corners) => {
    expect(dieShape(sides, 10)).toHaveLength(corners * 2);
  });

  it.each(DIE_SIDES)("keeps the d%d inside its size", (sides) => {
    for (const value of dieShape(sides, 10)) {
      expect(Math.abs(value)).toBeLessThanOrEqual(12.000001);
    }
  });

  it("draws the d6 as an upright square", () => {
    const corner = 10 * Math.SQRT1_2;
    expect(dieShape(6, 10).map((value) => value.toFixed(3))).toEqual(
      [corner, -corner, corner, corner, -corner, corner, -corner, -corner].map(
        (value) => value.toFixed(3),
      ),
    );
  });
});
