import { describe, expect, it } from "vitest";
import { strokeTouches } from "./strokeTouches";

const area = { x: 0, y: 0, width: 10, height: 10 };

describe("strokeTouches", () => {
  it("tells whether a line crosses the area", () => {
    const line = { color: "#000", points: [-5, 5, 15, 5] };
    expect(strokeTouches(line, area)).toBe(true);
    expect(strokeTouches({ ...line, points: [20, 20, 30, 30] }, area)).toBe(
      false,
    );
  });

  it("refuses a stroke of a single point", () => {
    expect(() =>
      strokeTouches({ color: "#000", points: [5, 5] }, area),
    ).toThrow("at least two points");
  });
});
