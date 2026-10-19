import { describe, expect, it } from "vitest";
import { CELL_SIZE } from "./grid";
import { toPoints } from "./points";
import { shapeCells, shapeOutline } from "./shapes";

const origin = { x: 100, y: 200 };

function outline(...args: Parameters<typeof shapeOutline>) {
  const points = shapeOutline(...args);
  if (!points) throw new Error("Expected a shape");
  return toPoints(points);
}

function cone(to: { x: number; y: number }) {
  const [start, left, right] = outline("cone", origin, to);
  if (!start || !left || !right) throw new Error("Expected three points");
  return { start, left, right };
}

describe("shapeCells", () => {
  it("rounds the distance to whole cells", () => {
    expect(
      shapeCells("circle", origin, { x: 100 + 2.4 * CELL_SIZE, y: 200 }),
    ).toBe(2);
    expect(
      shapeCells("cone", origin, { x: 100 + 2.6 * CELL_SIZE, y: 200 }),
    ).toBe(3);
  });

  it("measures circles and cones along the line to the pointer", () => {
    const to = { x: 100 + 3 * CELL_SIZE, y: 200 + 4 * CELL_SIZE };
    expect(shapeCells("circle", origin, to)).toBe(5);
    expect(shapeCells("cone", origin, to)).toBe(5);
  });

  it("measures squares by the longer side", () => {
    const to = { x: 100 + 3 * CELL_SIZE, y: 200 - 4 * CELL_SIZE };
    expect(shapeCells("square", origin, to)).toBe(4);
  });
});

describe("shapeOutline", () => {
  it("has no shape below half a cell", () => {
    const to = { x: 100 + 0.4 * CELL_SIZE, y: 200 };
    expect(shapeOutline("cone", origin, to)).toBeNull();
    expect(shapeOutline("square", origin, to)).toBeNull();
    expect(shapeOutline("circle", origin, to)).toBeNull();
  });

  it("makes a cone as wide at its end as it is long", () => {
    const length = 3 * CELL_SIZE;
    const { start, left, right } = cone({ x: 100 + length + 10, y: 200 });
    expect(start).toEqual(origin);
    expect(left.x).toBeCloseTo(100 + length);
    expect(left.y).toBeCloseTo(200 - length / 2);
    expect(right.x).toBeCloseTo(100 + length);
    expect(right.y).toBeCloseTo(200 + length / 2);
  });

  it("points a cone towards the pointer", () => {
    const { left, right } = cone({ x: 100, y: 200 + 2 * CELL_SIZE });
    expect((left.x + right.x) / 2).toBeCloseTo(100);
    expect((left.y + right.y) / 2).toBeCloseTo(200 + 2 * CELL_SIZE);
  });

  it("grows a square from its corner towards the pointer", () => {
    const side = 2 * CELL_SIZE;
    expect(outline("square", origin, { x: 210, y: 290 })).toEqual([
      origin,
      { x: 100 + side, y: 200 },
      { x: 100 + side, y: 200 + side },
      { x: 100, y: 200 + side },
    ]);
    expect(outline("square", origin, { x: 10, y: 110 })[2]).toEqual({
      x: 100 - side,
      y: 200 - side,
    });
  });

  it("keeps every point of a circle at its radius", () => {
    const radius = 4 * CELL_SIZE;
    const points = outline("circle", origin, { x: 100, y: 200 + radius });
    expect(points.length).toBeGreaterThan(8);
    for (const { x, y } of points) {
      expect(Math.hypot(x - origin.x, y - origin.y)).toBeCloseTo(radius);
    }
  });
});
