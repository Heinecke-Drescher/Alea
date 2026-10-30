import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { NO_ITEMS } from "./areaActions";
import { createRoom, type Room } from "./createRoom";
import type { MapTextData } from "./roomStore";

const TRAP: MapTextData = {
  text: "Trap",
  x: 100,
  y: 100,
  width: 40,
  height: 25,
  color: "#ff0000",
};

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function texts() {
  return Array.from(room.textsMap.values());
}

describe("texts in area actions", () => {
  it("moves selected texts freely", () => {
    const id = room.addText(TRAP);
    room.moveItems({ ...NO_ITEMS, texts: [id] }, 7, -3);
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
    const copy = room.textsMap.get(pasted.texts[0] ?? "");
    expect(copy).toMatchObject({ ...TRAP, x: 150, overFog: true });
  });

  it("keeps the font size when copying and pasting", () => {
    room.addText({ ...TRAP, fontSize: 40 });
    const clip = room.copyArea({ x: 90, y: 90, width: 20, height: 20 });
    const [id] = room.paste(clip, 0, 0).texts;
    expect(room.textsMap.get(id ?? "")?.fontSize).toBe(40);
  });

  it("pastes a player's text under the fog when the DM pastes it", () => {
    room.addText({ ...TRAP, overFog: true });
    const clip = room.copyArea({ x: 90, y: 90, width: 20, height: 20 });
    const [id] = room.paste(clip, 0, 0).texts;
    expect(room.textsMap.get(id ?? "")?.overFog).toBeUndefined();
  });

  it("deletes selected texts and texts in an area", () => {
    const selected = room.addText(TRAP);
    const inArea = room.addText({ ...TRAP, x: 300 });
    room.deleteItems({ ...NO_ITEMS, texts: [selected] });
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
    room.moveItems({ ...NO_ITEMS, texts: ["foreign"] }, 10, 0);
    expect(room.textsMap.get("foreign")).toEqual({
      ...TRAP,
      id: "foreign",
      x: 110,
    });
  });
});
