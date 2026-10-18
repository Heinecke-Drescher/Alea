import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { FOG_KEY, fogEnabled, foggedCells } from "./fog";
import { DEFAULT_MAP_BOUNDS } from "./grid";

const { columns, rows } = DEFAULT_MAP_BOUNDS;

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function fogged() {
  return foggedCells(
    room.mapBounds(),
    Object.fromEntries(room.revealedMap.entries()),
    fogEnabled(room.fogMap.get(FOG_KEY)),
  );
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

  it("treats other players' values for the switch as off", () => {
    expect(fogEnabled(true)).toBe(true);
    expect(fogEnabled("yes")).toBe(false);
    expect(fogEnabled(1)).toBe(false);
    expect(fogEnabled(undefined)).toBe(false);
  });
});
