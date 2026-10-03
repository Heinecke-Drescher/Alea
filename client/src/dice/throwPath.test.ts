import { describe, expect, it } from "vitest";
import {
  dragVelocity,
  MAX_THROW_DISTANCE,
  pathLength,
  pointAlong,
  throwPath,
} from "./throwPath";

const map = { x: 0, y: 0, columns: 10, rows: 10 };
const size = 500;

function rounded(path: number[]) {
  return path.map((value) => Math.round(value));
}

function isOnMap(path: number[]) {
  return path.every((value) => value >= 0 && value <= size);
}

describe("pathLength and pointAlong", () => {
  const bounced = [0, 0, 30, 40, 30, 10];

  it("adds up the segments of a path", () => {
    expect(pathLength(bounced)).toBe(80);
    expect(pathLength([7, 7, 7, 7])).toBe(0);
  });

  it("finds the point at a distance along the path", () => {
    expect(pointAlong(bounced, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAlong(bounced, 25)).toEqual({ x: 15, y: 20 });
    expect(pointAlong(bounced, 60)).toEqual({ x: 30, y: 30 });
    expect(pointAlong(bounced, 999)).toEqual({ x: 30, y: 10 });
  });

  it("rejects broken paths", () => {
    expect(() => pathLength([1, 2, 3])).toThrow();
  });
});

describe("dragVelocity", () => {
  it("measures the speed over the last moments of the drag", () => {
    expect(
      dragVelocity([
        { x: 0, y: 0, time: 0 },
        { x: 10, y: 0, time: 200 },
        { x: 30, y: 10, time: 250 },
        { x: 50, y: 20, time: 300 },
      ]),
    ).toEqual({ x: 400, y: 200 });
  });

  it("loses the swing when the die is held still before letting go", () => {
    expect(
      dragVelocity([
        { x: 0, y: 0, time: 0 },
        { x: 100, y: 0, time: 50 },
        { x: 100, y: 0, time: 250 },
      ]),
    ).toEqual({ x: 0, y: 0 });
  });

  it("has no swing without movement over time", () => {
    expect(dragVelocity([])).toEqual({ x: 0, y: 0 });
    expect(dragVelocity([{ x: 5, y: 5, time: 10 }])).toEqual({ x: 0, y: 0 });
  });
});

describe("throwPath", () => {
  it("rolls straight on in the direction of the throw", () => {
    expect(
      rounded(throwPath({ x: 100, y: 100 }, { x: 100, y: 0 }, map)),
    ).toEqual([100, 100, 300, 100]);
  });

  it("stays where the die was dropped without any swing", () => {
    expect(throwPath({ x: 100, y: 100 }, { x: 0, y: 0 }, map)).toEqual([
      100, 100, 100, 100,
    ]);
  });

  it("bounces off an edge and loses some swing", () => {
    expect(
      rounded(throwPath({ x: 450, y: 100 }, { x: 150, y: 0 }, map)),
    ).toEqual([450, 100, 500, 100, 350, 100]);
  });

  it("bounces back from a corner", () => {
    const path = rounded(
      throwPath({ x: 450, y: 450 }, { x: 400, y: 400 }, map),
    );
    expect(path.slice(0, 4)).toEqual([450, 450, 500, 500]);
    expect(path[4]).toBeLessThan(500);
    expect(path[5]).toBeLessThan(500);
  });

  it("never leaves the map", () => {
    for (const velocity of [
      { x: 5000, y: 1200 },
      { x: -3000, y: 4000 },
      { x: -100, y: -9000 },
    ]) {
      expect(isOnMap(throwPath({ x: 30, y: 470 }, velocity, map))).toBe(true);
    }
  });

  it("limits how far a die rolls", () => {
    const [x0, , x1] = throwPath(
      { x: 0, y: 250 },
      { x: 100000, y: 0 },
      { ...map, columns: 100 },
    );
    if (x0 === undefined || x1 === undefined) {
      throw new Error("Expected a path");
    }
    expect(x1 - x0).toBeCloseTo(MAX_THROW_DISTANCE);
  });

  it("starts on the map when dropped beside it", () => {
    const [x, y] = throwPath({ x: -80, y: 900 }, { x: 0, y: 0 }, map);
    expect([x, y]).toEqual([0, size]);
  });
});
