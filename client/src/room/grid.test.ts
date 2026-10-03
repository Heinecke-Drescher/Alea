import { describe, expect, it } from "vitest";
import {
  CELL_SIZE,
  clampToMap,
  MAX_MAP_CELLS,
  MAX_TOKEN_SIZE,
  MIN_MAP_CELLS,
  snapMapBounds,
  snapTokenSquare,
} from "./grid";

const box = (x: number, y: number, width: number, height: number) => ({
  x: x * CELL_SIZE,
  y: y * CELL_SIZE,
  width: width * CELL_SIZE,
  height: height * CELL_SIZE,
});

describe("clampToMap", () => {
  const map = { x: -2, y: 0, columns: 10, rows: 4 };

  it("keeps points on the map as they are", () => {
    expect(clampToMap({ x: 10, y: 20 }, map)).toEqual({ x: 10, y: 20 });
  });

  it("moves points beside the map to its nearest edge", () => {
    expect(clampToMap({ x: -1000, y: 1000 }, map)).toEqual({
      x: -2 * CELL_SIZE,
      y: 4 * CELL_SIZE,
    });
  });
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

describe("snapTokenSquare", () => {
  it("grows from the bottom right corner in whole cells", () => {
    expect(snapTokenSquare(box(2, 3, 2.2, 2.2), "bottom-right")).toEqual({
      x: 2,
      y: 3,
      size: 2,
    });
  });

  it("keeps the bottom right corner when dragged at the top left", () => {
    expect(snapTokenSquare(box(1, 2, 3, 3), "top-left")).toEqual({
      x: 1,
      y: 2,
      size: 3,
    });
    expect(snapTokenSquare(box(-1, 0, 5, 5), "top-left")).toEqual({
      x: 4 - MAX_TOKEN_SIZE,
      y: 5 - MAX_TOKEN_SIZE,
      size: MAX_TOKEN_SIZE,
    });
  });

  it("never shrinks below one cell", () => {
    expect(snapTokenSquare(box(5, 5, 0.2, 0.2), "bottom-left")).toEqual({
      x: 4,
      y: 5,
      size: 1,
    });
  });
});
