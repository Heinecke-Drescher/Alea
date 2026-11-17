import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { NO_ITEMS, oneItem } from "./areaActions";
import { createRoom, type Room } from "./createRoom";
import { isClosed, isOverFog } from "./drawing";
import { CELL_SIZE, DEFAULT_MAP_BOUNDS, mapRect } from "./grid";
import { validValues, type MapTextData } from "./roomStore";
import type { AreaShape } from "./shapes";
import { TEXT_FONT_SIZES } from "./texts";
import { validToken } from "./tokens";
import { IMAGE, moveOnlyTokenTo, only, strokeOf, tokenOf } from "./testRoom";

const TRAP: MapTextData = {
  text: "Trap",
  x: 100,
  y: 100,
  width: 40,
  height: 25,
  color: "#ff0000",
  fontSize: TEXT_FONT_SIZES.M,
};

const SQUARE: AreaShape = {
  kind: "square",
  from: { x: 0, y: 0 },
  to: { x: 100, y: 100 },
};
const { columns } = DEFAULT_MAP_BOUNDS;

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function texts() {
  return Array.from(room.textsMap.values());
}

function textOf(id: string | undefined) {
  const text = id && room.textsMap.get(id);
  if (!text) throw new Error(`Expected text ${id}`);
  return text;
}

function onlyToken() {
  return tokenOf(room, only(room.tokensMap.keys()));
}

describe("texts in area actions", () => {
  it("moves selected texts freely", () => {
    const id = room.addText(TRAP);
    room.moveItems(oneItem("texts", id), 7, -3);
    expect(room.textsMap.get(id)).toMatchObject({ x: 107, y: 97 });
  });

  it("moves texts that touch the area", () => {
    const touching = room.addText(TRAP);
    const outside = room.addText({ ...TRAP, x: 300 });
    room.moveArea({ x: 140, y: 125, width: 50, height: 50 }, 1, 0);
    expect(room.textsMap.get(touching)?.x).toBe(150);
    expect(room.textsMap.get(outside)?.x).toBe(300);
  });

  it("copies and pastes texts, shifted and above the fog for players", () => {
    room.addText(TRAP);
    const clip = room.copyArea({ x: 90, y: 90, width: 20, height: 20 });
    expect(clip.texts).toEqual([TRAP]);
    const pasted = room.paste(clip, 50, 0, true);
    expect(textOf(pasted.texts[0])).toMatchObject({
      ...TRAP,
      x: 150,
      overFog: true,
    });
  });

  it("keeps the font size when copying and pasting", () => {
    room.addText({ ...TRAP, fontSize: 40 });
    const clip = room.copyArea({ x: 90, y: 90, width: 20, height: 20 });
    const [id] = room.paste(clip, 0, 0).texts;
    expect(textOf(id).fontSize).toBe(40);
  });

  it("pastes a player's text under the fog when the DM pastes it", () => {
    room.addText({ ...TRAP, overFog: true });
    const clip = room.copyArea({ x: 90, y: 90, width: 20, height: 20 });
    const [id] = room.paste(clip, 0, 0).texts;
    expect(textOf(id).overFog).toBeUndefined();
  });

  it("deletes selected texts and texts in an area", () => {
    const selected = room.addText(TRAP);
    const inArea = room.addText({ ...TRAP, x: 300 });
    room.deleteItems(oneItem("texts", selected));
    expect(texts().map((text) => text.id)).toEqual([inArea]);
    room.deleteArea({ x: 290, y: 90, width: 20, height: 20 });
    expect(texts()).toEqual([]);
  });

  it("skips texts that another player removed or broke", () => {
    const id = room.addText(TRAP);
    room.textsMap.set("broken", { id: "broken", text: "" } as never);
    const clip = room.copyItems({ ...NO_ITEMS, texts: [id, "gone", "broken"] });
    expect(clip.texts).toEqual([TRAP]);
  });

  it("keeps only the known fields of a text when moving it", () => {
    room.textsMap.set("foreign", { ...TRAP, id: "foreign", extra: 1 } as never);
    room.moveItems(oneItem("texts", "foreign"), 10, 0);
    expect(room.textsMap.get("foreign")).toEqual({
      ...TRAP,
      id: "foreign",
      x: 110,
    });
  });
});

describe("moveArea", () => {
  const oneCell = mapRect({ x: 1, y: 1, columns: 1, rows: 1 });

  it("moves the cells inside the area", () => {
    room.paintCell(1, 1, "#ff0000");
    room.paintCell(5, 5, "#00ff00");
    room.moveArea({ x: 40, y: 40, width: 40, height: 40 }, 2, 3);
    expect(Object.keys(room.cellsMap.toJSON()).sort()).toEqual(["3,4", "5,5"]);
  });

  it("moves cells the area reaches into, but not the ones it grazes", () => {
    room.paintCell(1, 1, "#ff0000");
    room.paintCell(3, 1, "#00ff00");
    room.moveArea({ x: 85, y: 50, width: 75, height: 50 }, 0, 2);
    expect(Object.keys(room.cellsMap.toJSON()).sort()).toEqual(["1,3", "3,1"]);
  });

  it("paints over cells at the destination", () => {
    room.paintCell(1, 1, "#ff0000");
    room.paintCell(2, 1, "#00ff00");
    room.moveArea(oneCell, 1, 0);
    expect(room.cellsMap.toJSON()).toEqual({
      "2,1": { x: 2, y: 1, color: "#ff0000" },
    });
  });

  it("moves tokens the area reaches into and keeps them on the map", () => {
    room.addToken("Dragon", IMAGE, { x: 0, y: 0 });
    room.resizeToken(onlyToken().id, { ...onlyToken(), size: 3 });
    room.moveArea(oneCell, columns, 2);
    expect(onlyToken()).toMatchObject({ x: columns - 3, y: 2 });
  });

  it("moves every stroke that touches the area", () => {
    room.addStroke("#000000", [60, 60, 90, 90]);
    room.addStroke("#ff0000", [0, 75, 150, 75]);
    room.addStroke("#00ff00", [200, 200, 250, 250]);
    const [inner, crossing, outer] = room.strokesMap.keys();
    if (!inner || !crossing || !outer) throw new Error("Expected 3 strokes");
    room.moveArea(oneCell, 1, 0);
    expect(strokeOf(room, inner).points).toEqual([110, 60, 140, 90]);
    expect(strokeOf(room, crossing).points).toEqual([50, 75, 200, 75]);
    expect(strokeOf(room, outer).points).toEqual([200, 200, 250, 250]);
  });

  it("is undone in a single step", () => {
    room.paintCell(1, 1, "#ff0000");
    room.addStroke("#000000", [0, 75, 150, 75]);
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    moveOnlyTokenTo(room, 1, 1);
    const before = room.doc.toJSON();
    room.moveArea(oneCell, 2, 2);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });
});

describe("moveItems", () => {
  const strokes = (ids: string[]) => ({ strokes: ids, tokens: [], texts: [] });

  it("moves only the given strokes by pixels", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    room.addStroke("#ff0000", [30, 30, 40, 40]);
    const [first, second] = room.strokesMap.keys();
    if (!first || !second) throw new Error("Expected two strokes");
    room.moveItems(strokes([first]), 5, -3);
    expect(strokeOf(room, first).points).toEqual([15, 7, 25, 17]);
    expect(strokeOf(room, second).points).toEqual([30, 30, 40, 40]);
  });

  it("moves strokes and tokens together in a single undo step", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const strokeId = only(room.strokesMap.keys());
    const before = room.doc.toJSON();
    const tokenId = onlyToken().id;
    room.moveItems(
      { strokes: [strokeId], tokens: [tokenId], texts: [] },
      2 * CELL_SIZE,
      CELL_SIZE,
    );
    expect(onlyToken()).toMatchObject({ x: 2, y: 1 });
    expect(strokeOf(room, strokeId).points).toEqual([110, 60, 120, 70]);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("refuses to move tokens off the grid", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const tokens = { strokes: [], tokens: [onlyToken().id], texts: [] };
    expect(() => room.moveItems(tokens, 7, 0)).toThrow();
  });

  it("skips items that were removed in the meantime", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    const id = only(room.strokesMap.keys());
    room.moveItems(strokes([id, "gone"]), 5, 5);
    expect(room.strokesMap.size).toBe(1);
    expect(strokeOf(room, id).points).toEqual([15, 15, 25, 25]);
  });

  it("moves a shape together with its outline", () => {
    const id = room.addShape("#000000", SQUARE, false);
    room.moveItems(strokes([id]), 50, 100);
    expect(strokeOf(room, id)).toMatchObject({
      points: [50, 100, 150, 100, 150, 200, 50, 200],
      shape: {
        kind: "square",
        from: { x: 50, y: 100 },
        to: { x: 150, y: 200 },
      },
    });
  });
});

describe("copy, paste and delete", () => {
  const firstCell = { x: 0, y: 0, width: CELL_SIZE, height: CELL_SIZE };

  function fillFirstCell() {
    room.paintCell(0, 0, "#ff0000");
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    room.addStroke("#000000", [10, 10, 20, 20]);
  }

  it("pastes a copied area as new objects and keeps the original", () => {
    fillFirstCell();
    const original = onlyToken();
    const clip = room.copyArea(firstCell);
    const pasted = room.paste(clip, 2 * CELL_SIZE, CELL_SIZE);

    expect(room.cellsMap.get("2,1")).toEqual({ x: 2, y: 1, color: "#ff0000" });
    const copy = validValues(room.tokensMap.entries(), validToken).find(
      (token) => token.id !== original.id,
    );
    if (!copy) throw new Error("Expected a pasted token");
    expect(copy).toMatchObject({ name: "Goblin", x: 2, y: 1 });
    expect(copy.imageId).not.toBe(original.imageId);
    expect(room.imagesMap.get(copy.imageId)).toBe(IMAGE);
    const [strokeId, ...rest] = pasted.strokes;
    if (!strokeId) throw new Error("Expected a pasted stroke");
    expect(rest).toEqual([]);
    expect(strokeOf(room, strokeId).points).toEqual([110, 60, 120, 70]);
    expect(pasted.tokens).toEqual([copy.id]);
    expect(room.cellsMap.size).toBe(2);
    expect(room.tokensMap.size).toBe(2);
    expect(room.strokesMap.size).toBe(2);
  });

  it("pastes copied strokes by pixels", () => {
    room.addStroke("#000000", [10, 10, 20, 20]);
    const id = only(room.strokesMap.keys());
    const clip = room.copyItems(oneItem("strokes", id));
    const [copyId] = room.paste(clip, 7, 3).strokes;
    if (!copyId) throw new Error("Expected a pasted stroke");
    expect(copyId).not.toBe(id);
    expect(strokeOf(room, copyId).points).toEqual([17, 13, 27, 23]);
  });

  it("pastes shapes as shapes", () => {
    const id = room.addShape("#000000", SQUARE, false);
    const clip = room.copyItems(oneItem("strokes", id));
    const [copyId] = room.paste(clip, 10, 0).strokes;
    const copy = strokeOf(room, copyId);
    expect(isClosed(copy)).toBe(true);
    expect(copy.shape).toEqual({
      kind: "square",
      from: { x: 10, y: 0 },
      to: { x: 110, y: 100 },
    });
  });

  it("selects a shape by its closing edge", () => {
    room.addShape("#000000", SQUARE, false);
    const closingEdge = { x: -10, y: 40, width: 20, height: 20 };
    expect(room.copyArea(closingEdge).strokes).toHaveLength(1);
  });

  it("copies only known stroke data from other players", () => {
    room.strokesMap.set("foreign", {
      id: "foreign",
      color: "#000000",
      points: [10, 10, 20, 20],
      extra: 1,
    });
    const clip = room.copyItems(oneItem("strokes", "foreign"));
    expect(clip.strokes).toEqual([
      { color: "#000000", points: [10, 10, 20, 20] },
    ]);
  });

  it("marks pasted strokes by the one who pastes and keeps the mark when moved", () => {
    room.addStroke("#000000", [10, 10, 20, 20], true);
    const id = only(room.strokesMap.keys());
    const clip = room.copyItems(oneItem("strokes", id));
    const [belowId] = room.paste(clip, 5, 5).strokes;
    const [aboveId] = room.paste(clip, 5, 5, true).strokes;
    expect(isOverFog(strokeOf(room, belowId))).toBe(false);
    expect(isOverFog(strokeOf(room, aboveId))).toBe(true);
    room.moveItems(oneItem("strokes", id), 30, 0);
    expect(isOverFog(strokeOf(room, id))).toBe(true);
  });

  it("refuses to paste cells off the grid", () => {
    room.paintCell(0, 0, "#ff0000");
    const clip = room.copyArea(firstCell);
    expect(() => room.paste(clip, 7, 0)).toThrow();
  });

  it("pastes in a single undo step", () => {
    fillFirstCell();
    const before = room.doc.toJSON();
    room.paste(room.copyArea(firstCell), CELL_SIZE, 0);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("deletes everything in an area in a single undo step", () => {
    fillFirstCell();
    const before = room.doc.toJSON();
    room.deleteArea(firstCell);
    expect(room.cellsMap.size).toBe(0);
    expect(room.tokensMap.size).toBe(0);
    expect(room.imagesMap.size).toBe(0);
    expect(room.strokesMap.size).toBe(0);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("stores a pasted token in the same form as an imported one", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const original = onlyToken();
    const clip = room.copyItems(oneItem("tokens", original.id));
    const pastedId = only(room.paste(clip, CELL_SIZE, 0).tokens);
    const other = createRoom(new Y.Doc());
    other.importMap(room.exportMap());
    const goblin = {
      id: expect.any(String),
      imageId: expect.any(String),
      name: "Goblin",
      x: 1,
      y: 0,
      size: 1,
      order: expect.any(Number),
    };
    expect(room.tokensMap.get(pastedId)).toEqual(goblin);
    expect([...other.tokensMap.values()]).toContainEqual(goblin);
  });

  it("copies the given items and skips ones that are gone", () => {
    fillFirstCell();
    const token = onlyToken();
    const clip = room.copyItems({
      strokes: ["gone"],
      tokens: [token.id],
      texts: [],
    });
    expect(clip.cells).toEqual([]);
    expect(clip.tokens).toEqual([
      {
        name: "Goblin",
        image: IMAGE,
        x: 0,
        y: 0,
        size: 1,
        effects: [],
        marks: [],
      },
    ]);
    expect(clip.strokes).toEqual([]);
  });

  it("deletes only the given items in a single undo step", () => {
    fillFirstCell();
    room.addStroke("#ff0000", [30, 30, 40, 40]);
    const [first] = room.strokesMap.keys();
    if (!first) throw new Error("Expected a stroke");
    const before = room.doc.toJSON();
    room.deleteItems({ strokes: [first], tokens: [onlyToken().id], texts: [] });
    expect(room.strokesMap.size).toBe(1);
    expect(room.strokesMap.has(first)).toBe(false);
    expect(room.tokensMap.size).toBe(0);
    expect(room.imagesMap.size).toBe(0);
    expect(room.cellsMap.size).toBe(1);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });
});
