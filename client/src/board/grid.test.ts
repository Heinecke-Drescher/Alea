import { describe, expect, it } from "vitest";
import { CELL_SIZE, MAX_MAP_CELLS, MIN_MAP_CELLS, snapMapBounds } from "./grid";

const box = (x: number, y: number, width: number, height: number) => ({
  x: x * CELL_SIZE,
  y: y * CELL_SIZE,
  width: width * CELL_SIZE,
  height: height * CELL_SIZE,
});

describe("snapMapBounds", () => {
  it("rounds a dragged box to whole cells", () => {
    expect(
      snapMapBounds({ x: -260, y: 20, width: 1780, height: 990 }, "top-left"),
    ).toEqual({ x: -5, y: 0, columns: 35, rows: 20 });
  });

  it("keeps the right edge when the left edge hits the minimum", () => {
    expect(snapMapBounds(box(28, 0, 2, 20), "middle-left")).toEqual({
      x: 30 - MIN_MAP_CELLS,
      y: 0,
      columns: MIN_MAP_CELLS,
      rows: 20,
    });
  });

  it("keeps the top edge when the bottom edge hits the maximum", () => {
    expect(snapMapBounds(box(0, -3, 30, 200), "bottom-center")).toEqual({
      x: 0,
      y: -3,
      columns: 30,
      rows: MAX_MAP_CELLS,
    });
  });
});
