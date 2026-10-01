import { describe, expect, it } from "vitest";
import { CELL_SIZE, MAP_HEIGHT, MAP_WIDTH } from "./grid";
import { boxBetween, cellOffset, clipToMap } from "./selection";

describe("boxBetween", () => {
  it("spans from the start to the end point", () => {
    expect(boxBetween({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  it("also works when dragging up and to the left", () => {
    expect(boxBetween({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });
});

describe("clipToMap", () => {
  it("keeps a box inside the map unchanged", () => {
    const box = { x: 10, y: 20, width: 30, height: 40 };
    expect(clipToMap(box)).toEqual(box);
  });

  it("cuts off the parts outside the map", () => {
    expect(
      clipToMap({ x: -10, y: MAP_HEIGHT - 20, width: 50, height: 100 }),
    ).toEqual({ x: 0, y: MAP_HEIGHT - 20, width: 40, height: 20 });
  });

  it("returns null for a box completely outside the map", () => {
    expect(
      clipToMap({ x: MAP_WIDTH + 1, y: 0, width: 10, height: 10 }),
    ).toBeNull();
  });
});

describe("cellOffset", () => {
  const area = { x: 60, y: 60, width: 80, height: 80 };

  it("rounds the dragged position to whole cells", () => {
    expect(
      cellOffset(area, { x: 60 + 1.4 * CELL_SIZE, y: 60 - 0.6 * CELL_SIZE }),
    ).toEqual({
      dx: 1,
      dy: -1,
    });
  });

  it("keeps the area on the map", () => {
    expect(cellOffset(area, { x: -1000, y: MAP_HEIGHT + 1000 })).toEqual({
      dx: -1,
      dy: Math.floor((MAP_HEIGHT - 140) / CELL_SIZE),
    });
    expect(cellOffset(area, { x: MAP_WIDTH, y: -1000 }).dx).toBe(
      Math.floor((MAP_WIDTH - 140) / CELL_SIZE),
    );
  });
});
