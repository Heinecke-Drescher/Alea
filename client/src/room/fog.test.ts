import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import {
  FOG_KEY,
  fogEnabled,
  foggedCells,
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
    revealed: Object.fromEntries(room.revealedMap.entries()),
    enabled: fogEnabled(room.fogMap.get(FOG_KEY)),
  };
}

function fogged() {
  return foggedCells(fogView());
}

describe("fog of war", () => {
  it("hides nothing until it is switched on", () => {
    room.revealCells({ x: 0, y: 0 }, { x: 1, y: 1 });
    expect(fogged()).toEqual([]);
  });

  it("hides the whole map once it is switched on", () => {
    room.setFogEnabled(true);
    expect(fogged()).toHaveLength(columns * rows);
    room.setFogEnabled(false);
    expect(fogged()).toEqual([]);
  });

  it("reveals and hides the cells between two corners in any order", () => {
    room.setFogEnabled(true);
    room.revealCells({ x: 3, y: 2 }, { x: 1, y: 1 });
    expect(fogged()).toHaveLength(columns * rows - 6);
    expect(fogged()).not.toContainEqual({ x: 2, y: 1 });
    room.hideCells({ x: 2, y: 1 }, { x: 2, y: 2 });
    expect(fogged()).toHaveLength(columns * rows - 4);
    expect(fogged()).toContainEqual({ x: 2, y: 1 });
  });

  it("hides everything again", () => {
    room.setFogEnabled(true);
    room.revealCells({ x: 0, y: 0 }, { x: 5, y: 5 });
    room.hideEverything();
    expect(fogged()).toHaveLength(columns * rows);
  });

  it("undoes a reveal in one step but keeps the switch", () => {
    room.setFogEnabled(true);
    room.revealCells({ x: 0, y: 0 }, { x: 5, y: 5 });
    room.undoManager.undo();
    expect(fogged()).toHaveLength(columns * rows);
    expect(fogEnabled(room.fogMap.get(FOG_KEY))).toBe(true);
  });

  it("hides the new part of a grown map", () => {
    room.setFogEnabled(true);
    room.revealCells({ x: 0, y: 0 }, { x: columns - 1, y: rows - 1 });
    room.resize({ x: -1, y: 0, columns: columns + 1, rows });
    expect(fogged()).toEqual(
      Array.from({ length: rows }, (_, y) => ({ x: -1, y })),
    );
  });

  it("tells whether a rectangle in pixels touches a fogged cell", () => {
    room.setFogEnabled(true);
    room.revealCells({ x: 1, y: 1 }, { x: 2, y: 2 });
    const cells = (x: number, y: number, width: number, height: number) => ({
      x: x * CELL_SIZE,
      y: y * CELL_SIZE,
      width: width * CELL_SIZE,
      height: height * CELL_SIZE,
    });
    expect(rectTouchesFog(fogView(), cells(1, 1, 2, 2))).toBe(false);
    expect(rectTouchesFog(fogView(), cells(1, 1, 3, 2))).toBe(true);
    expect(
      rectTouchesFog(fogView(), { x: 60, y: 60, width: 5, height: 5 }),
    ).toBe(false);
    expect(
      rectTouchesFog(fogView(), { x: 140, y: 60, width: 20, height: 5 }),
    ).toBe(true);
  });

  it("tells whether stroke points lie in fogged cells", () => {
    room.setFogEnabled(true);
    room.revealCells({ x: 0, y: 0 }, { x: 1, y: 0 });
    expect(pointsTouchFog(fogView(), [10, 10, 90, 40])).toBe(false);
    expect(pointsTouchFog(fogView(), [10, 10, 90, 60])).toBe(true);
  });

  it("never fogs cells off the map", () => {
    room.setFogEnabled(true);
    const offMap = {
      x: -3 * CELL_SIZE,
      y: 0,
      width: CELL_SIZE,
      height: CELL_SIZE,
    };
    expect(rectTouchesFog(fogView(), offMap)).toBe(false);
  });

  it("lets everything through while the fog is off", () => {
    expect(
      rectTouchesFog(fogView(), { x: 0, y: 0, width: 500, height: 500 }),
    ).toBe(false);
  });

  it("treats other players' values for the switch as off", () => {
    expect(fogEnabled(true)).toBe(true);
    expect(fogEnabled("yes")).toBe(false);
    expect(fogEnabled(1)).toBe(false);
    expect(fogEnabled(undefined)).toBe(false);
  });
});
