import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import {
  foggedCells,
  isSquareHidden,
  pointsTouchFog,
  rectTouchesFog,
  type FogView,
} from "./fog";
import { CELL_SIZE, DEFAULT_MAP_BOUNDS } from "./grid";

const { columns, rows } = DEFAULT_MAP_BOUNDS;

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function fogView(): FogView {
  return {
    bounds: room.mapBounds(),
    fogged: Object.fromEntries(room.fogMap.entries()),
  };
}

function fogged() {
  return foggedCells(fogView());
}

const cells = (x: number, y: number, width: number, height: number) => ({
  x: x * CELL_SIZE,
  y: y * CELL_SIZE,
  width: width * CELL_SIZE,
  height: height * CELL_SIZE,
});

describe("fog of war", () => {
  it("hides nothing at first", () => {
    expect(fogged()).toEqual([]);
  });

  it("hides and reveals the cells between two corners in any order", () => {
    room.hideCells({ x: 3, y: 2 }, { x: 1, y: 1 });
    expect(fogged()).toHaveLength(6);
    expect(fogged()).toContainEqual({ x: 2, y: 1 });
    room.revealCells({ x: 2, y: 1 }, { x: 2, y: 2 });
    expect(fogged()).toHaveLength(4);
    expect(fogged()).not.toContainEqual({ x: 2, y: 1 });
  });

  it("covers the whole map with one rectangle", () => {
    room.hideCells({ x: 0, y: 0 }, { x: columns - 1, y: rows - 1 });
    expect(fogged()).toHaveLength(columns * rows);
  });

  it("undoes hiding in one step", () => {
    room.hideCells({ x: 0, y: 0 }, { x: 5, y: 5 });
    room.undoManager.undo();
    expect(fogged()).toEqual([]);
  });

  it("leaves the new part of a grown map open", () => {
    room.hideCells({ x: 0, y: 0 }, { x: columns - 1, y: rows - 1 });
    room.resize({ x: -1, y: 0, columns: columns + 1, rows });
    expect(fogged()).toHaveLength(columns * rows);
  });

  it("tells whether a rectangle in pixels touches a fogged cell", () => {
    room.hideCells({ x: 3, y: 1 }, { x: 3, y: 2 });
    expect(rectTouchesFog(fogView(), cells(1, 1, 2, 2))).toBe(false);
    expect(rectTouchesFog(fogView(), cells(1, 1, 3, 2))).toBe(true);
    expect(
      rectTouchesFog(fogView(), { x: 140, y: 60, width: 5, height: 5 }),
    ).toBe(false);
    expect(
      rectTouchesFog(fogView(), { x: 140, y: 60, width: 20, height: 5 }),
    ).toBe(true);
  });

  it("tells whether stroke points lie in fogged cells", () => {
    room.hideCells({ x: 0, y: 1 }, { x: 1, y: 1 });
    expect(pointsTouchFog(fogView(), [10, 10, 90, 40])).toBe(false);
    expect(pointsTouchFog(fogView(), [10, 10, 90, 60])).toBe(true);
  });

  it("hides a token only when all its cells are fogged", () => {
    room.hideCells({ x: 0, y: 0 }, { x: 2, y: 1 });
    expect(isSquareHidden(fogView(), { x: 0, y: 0, size: 2 })).toBe(true);
    expect(isSquareHidden(fogView(), { x: 1, y: 0, size: 3 })).toBe(false);
    expect(isSquareHidden(fogView(), { x: 4, y: 4, size: 1 })).toBe(false);
  });

  it("never fogs cells off the map", () => {
    room.hideCells({ x: -3, y: 0 }, { x: -1, y: 0 });
    expect(fogged()).toEqual([]);
    expect(rectTouchesFog(fogView(), cells(-3, 0, 3, 1))).toBe(false);
  });
});
