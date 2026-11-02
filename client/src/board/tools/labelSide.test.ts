import { describe, expect, it } from "vitest";
import { labelPlace } from "./labelSide";

const AT = { x: 100, y: 100 };

describe("labelPlace", () => {
  it("puts the label left of a line going right", () => {
    expect(labelPlace(AT, { x: 300, y: 150 }, 25)).toEqual({
      pointer: "right",
      x: 75,
      y: 100,
    });
  });

  it("puts the label right of a line going left", () => {
    expect(labelPlace(AT, { x: -100, y: 50 }, 25)).toEqual({
      pointer: "left",
      x: 125,
      y: 100,
    });
  });

  it("puts the label above a line going down", () => {
    expect(labelPlace(AT, { x: 120, y: 400 }, 25)).toEqual({
      pointer: "down",
      x: 100,
      y: 75,
    });
  });

  it("puts the label below a line going up", () => {
    expect(labelPlace(AT, { x: 80, y: -200 }, 25)).toEqual({
      pointer: "up",
      x: 100,
      y: 125,
    });
  });

  it("picks a side for a line without length", () => {
    expect(labelPlace(AT, AT, 0)).toEqual({ pointer: "right", x: 100, y: 100 });
  });
});
