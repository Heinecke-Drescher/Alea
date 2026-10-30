import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import type { MapTextData } from "./roomStore";
import { MAX_TEXT_LENGTH, validMapText } from "./texts";

const HELLO: MapTextData = {
  text: "Hello",
  x: 10,
  y: 20,
  width: 40,
  height: 25,
  color: "#ff0000",
};

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

describe("texts", () => {
  it("adds a text", () => {
    const id = room.addText(HELLO);
    expect(room.textsMap.get(id)).toEqual({ ...HELLO, id });
  });

  it("adds a text of the greatest length", () => {
    const text = "a".repeat(MAX_TEXT_LENGTH);
    const id = room.addText({ ...HELLO, text });
    expect(room.textsMap.get(id)?.text).toBe(text);
  });

  it("keeps a player's text above the fog", () => {
    const id = room.addText({ ...HELLO, overFog: true });
    expect(room.textsMap.get(id)?.overFog).toBe(true);
  });

  it.each<[string, MapTextData]>([
    ["no words", { ...HELLO, text: "" }],
    ["too many words", { ...HELLO, text: "a".repeat(MAX_TEXT_LENGTH + 1) }],
    ["no width", { ...HELLO, width: 0 }],
    ["an endless height", { ...HELLO, height: Infinity }],
    ["no position", { ...HELLO, x: Number.NaN }],
  ])("refuses a text with %s", (_, data) => {
    expect(() => room.addText(data)).toThrow("Invalid text");
    expect(room.textsMap.size).toBe(0);
  });

  it("edits the words and the size of a text", () => {
    const id = room.addText(HELLO);
    room.editText(id, { text: "Hello there", width: 90, height: 25 });
    expect(room.textsMap.get(id)).toEqual({
      ...HELLO,
      id,
      text: "Hello there",
      width: 90,
    });
  });

  it("removes a text whose words were all deleted", () => {
    const id = room.addText(HELLO);
    room.editText(id, { text: "", width: 1, height: 25 });
    expect(room.textsMap.has(id)).toBe(false);
  });

  it("ignores edits of a text that another player removed", () => {
    expect(() =>
      room.editText("gone", { text: "Hi", width: 20, height: 25 }),
    ).not.toThrow();
    expect(room.textsMap.size).toBe(0);
  });

  it("undoes adding, editing and removing step by step", () => {
    const id = room.addText(HELLO);
    room.editText(id, { text: "Hello there", width: 90, height: 25 });
    room.editText(id, { text: "", width: 1, height: 25 });
    room.undoManager.undo();
    expect(room.textsMap.get(id)?.text).toBe("Hello there");
    room.undoManager.undo();
    expect(room.textsMap.get(id)?.text).toBe("Hello");
    room.undoManager.undo();
    expect(room.textsMap.has(id)).toBe(false);
  });

  it("undoes texts removed in one go, as by one wipe of the eraser, at once", () => {
    const first = room.addText(HELLO);
    const second = room.addText({ ...HELLO, x: 100 });
    room.undoManager.stopCapturing();
    room.removeText(first);
    room.removeText(second);
    room.undoManager.undo();
    expect(room.textsMap.size).toBe(2);
  });

  it("removes texts together with the drawings", () => {
    room.addText(HELLO);
    room.clearDrawings();
    expect(room.textsMap.size).toBe(0);
  });

  it("reads only the known fields of other players' texts", () => {
    expect(
      validMapText({ ...HELLO, id: "a", overFog: true, extra: "<script>" }),
    ).toEqual({ ...HELLO, id: "a", overFog: true });
  });

  it.each<[string, unknown]>([
    ["no object", "Hello"],
    ["no id", HELLO],
    ["a number as words", { ...HELLO, id: "a", text: 5 }],
    ["a negative width", { ...HELLO, id: "a", width: -1 }],
    [
      "above the fog by something other than true",
      { ...HELLO, id: "a", overFog: "yes" },
    ],
  ])("ignores another player's text with %s", (_, value) => {
    expect(validMapText(value)).toBeNull();
  });
});
