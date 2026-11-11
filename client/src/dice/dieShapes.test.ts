import { describe, expect, it } from "vitest";
import { DIE_SIDES } from "../room/dice";
import { dieShape, outlineArea } from "./dieShapes";

// A regular hexagon of radius 10, the d20.
const D20_AREA = ((3 * Math.sqrt(3)) / 2) * 10 ** 2;

describe("dieShape", () => {
  it.each([
    [4, 3],
    [6, 4],
    [8, 4],
    [10, 6],
    [12, 5],
    [20, 6],
    [100, 6],
  ] as const)("draws a d%d with %d corners", (sides, corners) => {
    expect(dieShape(sides, 10)).toHaveLength(corners * 2);
  });

  it.each(DIE_SIDES)("gives the d%d the d20's area", (sides) => {
    expect(outlineArea(dieShape(sides, 10))).toBeCloseTo(D20_AREA);
  });

  it("keeps the d20 in its circle", () => {
    const [x, y] = dieShape(20, 10);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-10);
  });

  it("draws the d10 lying flat and wider than tall", () => {
    const points = dieShape(10, 10);
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    expect(width / height).toBeCloseTo(1.41, 1);
    expect(points[0]).toBeGreaterThan(0);
    expect(points[1]).toBe(0);
  });

  it("draws the d6 as an upright square", () => {
    const corner = Math.sqrt(D20_AREA) / 2;
    expect(dieShape(6, 10).map((value) => value.toFixed(3))).toEqual(
      [corner, -corner, corner, corner, -corner, corner, -corner, -corner].map(
        (value) => value.toFixed(3),
      ),
    );
  });
});
