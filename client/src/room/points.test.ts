import { describe, expect, it } from "vitest";
import { toPoints } from "./points";

describe("toPoints", () => {
  it("pairs the values into points", () => {
    expect(toPoints([1, 2, 3, 4])).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });

  it("refuses lists that are no points", () => {
    expect(() => toPoints([])).toThrow();
    expect(() => toPoints([1, 2, 3])).toThrow();
  });
});
