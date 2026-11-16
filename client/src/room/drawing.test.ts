import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { hasShapes, isClosed, isOverFog } from "./drawing";
import type { AreaShape } from "./shapes";

const IMAGE = "data:image/webp;base64,AAAA";
const SQUARE: AreaShape = {
  kind: "square",
  from: { x: 0, y: 0 },
  to: { x: 100, y: 100 },
};
const SQUARE_OUTLINE = [0, 0, 100, 0, 100, 100, 0, 100];

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

describe("drawing", () => {
  it("paints and erases cells", () => {
    room.paintCell(2, 3, "#ff0000");
    room.paintCell(2, 3, "#00ff00");
    expect(Array.from(room.cellsMap.values())).toEqual([
      { x: 2, y: 3, color: "#00ff00" },
    ]);
    room.eraseCell(2, 3);
    expect(room.cellsMap.size).toBe(0);
  });

  it("adds and removes strokes", () => {
    room.addStroke("#000000", [0, 0, 10, 10]);
    const [stroke] = room.strokesMap.values();
    if (!stroke) throw new Error("Expected a stroke");
    expect(stroke).toMatchObject({ color: "#000000", points: [0, 0, 10, 10] });
    room.removeStroke(stroke.id);
    expect(room.strokesMap.size).toBe(0);
  });

  it("adds shapes as closed strokes that remember their shape in one undo step", () => {
    const id = room.addShape("#000000", SQUARE, false);
    const shape = room.strokesMap.get(id);
    expect(shape).toMatchObject({ points: SQUARE_OUTLINE, shape: SQUARE });
    expect(shape && isClosed(shape)).toBe(true);
    room.undoManager.undo();
    expect(room.strokesMap.size).toBe(0);
  });

  it("reshapes a shape in one undo step", () => {
    const id = room.addShape("#000000", SQUARE, false);
    const before = room.doc.toJSON();
    room.reshapeStroke(id, { x: 50, y: 50 });
    expect(room.strokesMap.get(id)).toMatchObject({
      points: [0, 0, 50, 0, 50, 50, 0, 50],
      shape: { kind: "square", from: { x: 0, y: 0 }, to: { x: 50, y: 50 } },
    });
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("adds no undo step when a reshape keeps the size", () => {
    const id = room.addShape("#000000", SQUARE, false);
    room.reshapeStroke(id, { x: 110, y: 90 });
    expect(room.strokesMap.get(id)?.shape).toEqual(SQUARE);
    room.undoManager.undo();
    expect(room.strokesMap.size).toBe(0);
  });

  it("refuses to reshape lines and to shrink shapes to nothing", () => {
    room.addStroke("#000000", [0, 0, 10, 10]);
    const [lineId] = room.strokesMap.keys();
    if (!lineId) throw new Error("Expected a stroke");
    expect(() => room.reshapeStroke(lineId, { x: 50, y: 50 })).toThrow();
    const id = room.addShape("#000000", SQUARE, false);
    expect(() => room.reshapeStroke(id, SQUARE.from)).toThrow();
  });

  it("tells shapes apart from lines", () => {
    const line = { color: "#000000", points: [0, 0, 10, 10] };
    expect(hasShapes([line])).toBe(false);
    expect(hasShapes([line, { ...line, closed: true }])).toBe(true);
  });

  it("marks only the strokes drawn above the fog", () => {
    room.addStroke("#000000", [0, 0, 10, 10]);
    room.addStroke("#ff0000", [0, 0, 10, 10], true);
    const strokes = Array.from(room.strokesMap.values());
    const below = strokes.find((stroke) => stroke.color === "#000000");
    const above = strokes.find((stroke) => stroke.color === "#ff0000");
    expect(below).not.toHaveProperty("overFog");
    expect(above && isOverFog(above)).toBe(true);
  });

  it("reads only true as above the fog from other players' data", () => {
    const stroke = { id: "s", color: "#000000", points: [0, 0, 1, 1] };
    expect(isOverFog({ ...stroke, overFog: true })).toBe(true);
    expect(isOverFog({ ...stroke, overFog: "yes" } as never)).toBe(false);
    expect(isOverFog(stroke)).toBe(false);
  });

  it("clears drawings but keeps tokens", () => {
    room.paintCell(1, 1, "#ff0000");
    room.addStroke("#000000", [0, 0, 10, 10]);
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    room.clearDrawings();
    expect(room.cellsMap.size).toBe(0);
    expect(room.strokesMap.size).toBe(0);
    expect(room.tokensMap.size).toBe(1);
  });
});
