import { describe, expect, it } from "vitest";
import { dragVelocity } from "./dragVelocity";

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
