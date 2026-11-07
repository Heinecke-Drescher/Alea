import { describe, expect, it } from "vitest";
import { endAboveFinger } from "./fingerOffset";

describe("endAboveFinger", () => {
  const press = { x: 100, y: 200 };

  it("keeps the same distance on screen at every zoom", () => {
    expect(endAboveFinger({ x: 100, y: 300 }, press, 1)).toEqual({
      x: 100,
      y: 240,
    });
    expect(endAboveFinger({ x: 100, y: 300 }, press, 2)).toEqual({
      x: 100,
      y: 270,
    });
    expect(endAboveFinger({ x: 100, y: 300 }, press, 0.5)).toEqual({
      x: 100,
      y: 180,
    });
  });

  it("stays under a finger that has only moved as far as a tap", () => {
    expect(endAboveFinger({ x: 105, y: 205 }, press, 1)).toEqual({
      x: 105,
      y: 205,
    });
    // The same distance on the map is ten screen pixels when zoomed in.
    expect(endAboveFinger({ x: 105, y: 205 }, press, 2).y).toBe(175);
  });
});
