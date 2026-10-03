import { describe, expect, it } from "vitest";
import {
  CELL_SIZE,
  clampToMap,
  dropCells,
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

describe("dropCells", () => {
  const map = { x: 0, y: 0, columns: 20, rows: 10 };

  it("lays tokens out to the right of the start cell", () => {
    expect(dropCells({ x: 3, y: 4 }, 3, map)).toEqual([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
    ]);
  });

  it("shifts the row left so it stays on the map", () => {
    expect(dropCells({ x: 18, y: 4 }, 4, map)).toEqual([
      { x: 16, y: 4 },
      { x: 17, y: 4 },
      { x: 18, y: 4 },
      { x: 19, y: 4 },
    ]);
  });

  it("moves a start beside the map onto it", () => {
    expect(dropCells({ x: -5, y: 30 }, 1, map)).toEqual([{ x: 0, y: 9 }]);
  });

  it("continues in the next row when a row is full", () => {
    const narrow = { x: 0, y: 0, columns: 5, rows: 10 };
    expect(dropCells({ x: 3, y: 1 }, 7, narrow)).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });

  it("shifts the rows up so they stay on the map", () => {
    const narrow = { x: 0, y: 0, columns: 5, rows: 10 };
    expect(dropCells({ x: 0, y: 9 }, 6, narrow)).toEqual([
      { x: 0, y: 8 },
      { x: 1, y: 8 },
      { x: 2, y: 8 },
      { x: 3, y: 8 },
      { x: 4, y: 8 },
      { x: 0, y: 9 },
    ]);
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
