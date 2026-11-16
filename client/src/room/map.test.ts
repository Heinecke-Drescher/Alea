import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { CELL_SIZE, DEFAULT_MAP_BOUNDS } from "./grid";
import { createRoom, type Room } from "./createRoom";
import { IMAGE, moveOnlyTokenTo, only } from "./testRoom";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function onlyToken() {
  return only(room.tokensMap.values());
}

describe("map bounds", () => {
  const bounds = (x: number, y: number, columns: number, rows: number) => ({
    x,
    y,
    columns,
    rows,
  });

  it("starts with the default bounds", () => {
    expect(room.mapBounds()).toEqual(DEFAULT_MAP_BOUNDS);
  });

  it("grows and shrinks when nothing would end up outside", () => {
    expect(room.resize(bounds(0, 0, 60, 40))).toBe(true);
    expect(room.mapBounds()).toEqual(bounds(0, 0, 60, 40));
    expect(room.resize(bounds(0, 0, 12, 10))).toBe(true);
    expect(room.mapBounds()).toEqual(bounds(0, 0, 12, 10));
  });

  it("grows to the left and top without moving anything", () => {
    room.paintCell(0, 0, "#ff0000");
    expect(room.resize(bounds(-5, -3, 35, 23))).toBe(true);
    expect(room.cellsMap.get("0,0")).toEqual({ x: 0, y: 0, color: "#ff0000" });
    room.paintCell(-5, -3, "#00ff00");
    expect(room.cellsMap.get("-5,-3")).toMatchObject({ color: "#00ff00" });
  });

  it("refuses to shrink below cells or tokens", () => {
    room.paintCell(10, 0, "#ff0000");
    expect(room.resize(bounds(0, 0, 10, 20))).toBe(false);
    expect(room.resize(bounds(11, 0, 20, 20))).toBe(false);
    room.eraseCell(10, 0);

    room.addToken("Ogre", IMAGE, { x: 0, y: 0 });
    moveOnlyTokenTo(room, 0, 8);
    room.resizeToken(onlyToken().id, { ...onlyToken(), size: 3 });
    expect(room.resize(bounds(0, 0, 30, 10))).toBe(false);
    expect(room.resize(bounds(0, 9, 30, 11))).toBe(false);
    expect(room.mapBounds()).toEqual(DEFAULT_MAP_BOUNDS);
  });

  it("lets strokes stick out of the map", () => {
    room.addStroke("#000000", [-40, 0, 10 * CELL_SIZE + 1, 0]);
    expect(room.resize(bounds(0, 0, 40, 20))).toBe(true);
    expect(room.resize(bounds(1, 0, 10, 20))).toBe(true);
  });

  it("rejects bounds outside the limits", () => {
    expect(() => room.resize(bounds(0, 0, 9, 20))).toThrow();
    expect(() => room.resize(bounds(0, 0, 30, 101))).toThrow();
    expect(() => room.resize(bounds(0, 0, 30.5, 20))).toThrow();
    expect(() => room.resize(bounds(0.5, 0, 30, 20))).toThrow();
  });

  it("keeps tokens inside the stored bounds", () => {
    room.resize(bounds(-10, 0, 40, 20));
    room.addToken("Ogre", IMAGE, { x: -10, y: 0 });
    expect(onlyToken()).toMatchObject({ x: -10, y: 0 });
    moveOnlyTokenTo(room, 29, 0);
    room.resizeToken(onlyToken().id, { ...onlyToken(), size: 2 });
    expect(onlyToken()).toMatchObject({ x: 28, y: 0 });
  });

  it("is not undone, so others' new content cannot end up off the map", () => {
    room.paintCell(0, 0, "#ff0000");
    room.resize(bounds(-5, 0, 60, 40));
    room.undoManager.undo();
    expect(room.mapBounds()).toEqual(bounds(-5, 0, 60, 40));
    expect(room.cellsMap.size).toBe(0);
  });
});
