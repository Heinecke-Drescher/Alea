import { describe, expect, it } from "vitest";
import { cellDistance, measurementCell } from "./measurement";

describe("cellDistance", () => {
  it.each([
    ["same cell", { x: 2, y: 3 }, { x: 2, y: 3 }, 0],
    ["horizontal", { x: 0, y: 0 }, { x: 5, y: 0 }, 5],
    ["vertical", { x: 0, y: 0 }, { x: 0, y: 4 }, 4],
    ["diagonal", { x: 0, y: 0 }, { x: 3, y: 3 }, 3],
    ["mixed direction", { x: 0, y: 0 }, { x: 5, y: 2 }, 5],
    ["negative coordinates", { x: -4, y: -3 }, { x: 2, y: 1 }, 6],
  ])("counts cells for %s in both directions", (_, from, to, expected) => {
    expect(cellDistance({ from, to })).toBe(expected);
    expect(cellDistance({ from: to, to: from })).toBe(expected);
  });
});

describe("measurementCell", () => {
  const map = { x: -3, y: -2, columns: 5, rows: 6 };

  it("keeps a cell inside the map", () => {
    expect(measurementCell({ x: 0, y: 1 }, map)).toEqual({ x: 0, y: 1 });
  });

  it("limits targets to the first cell at the top and left", () => {
    expect(measurementCell({ x: -10, y: -10 }, map)).toEqual({ x: -3, y: -2 });
  });

  it("limits targets to the last cell at the bottom and right", () => {
    expect(measurementCell({ x: 2, y: 4 }, map)).toEqual({ x: 1, y: 3 });
    expect(measurementCell({ x: 100, y: 100 }, map)).toEqual({ x: 1, y: 3 });
  });
});
