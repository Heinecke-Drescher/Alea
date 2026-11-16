import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { BACKGROUND_IMAGE_ID } from "./background";
import { createRoom, type Room } from "./createRoom";

const IMAGE = "data:image/webp;base64,AAAA";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

describe("background", () => {
  it("sets, replaces and removes the map background", () => {
    room.setBackground(IMAGE);
    room.setBackground("data:image/webp;base64,BBBB");
    expect(room.imagesMap.get(BACKGROUND_IMAGE_ID)).toBe(
      "data:image/webp;base64,BBBB",
    );
    room.removeBackground();
    expect(room.imagesMap.has(BACKGROUND_IMAGE_ID)).toBe(false);
  });

  it("undoes each change in its own step", () => {
    room.setBackground(IMAGE);
    room.removeBackground();
    room.undoManager.undo();
    expect(room.imagesMap.get(BACKGROUND_IMAGE_ID)).toBe(IMAGE);
    room.undoManager.undo();
    expect(room.imagesMap.has(BACKGROUND_IMAGE_ID)).toBe(false);
  });

  it.each([
    ["setting", () => room.setBackground(IMAGE)],
    ["removing", () => room.removeBackground()],
  ])("keeps a cell painted right after %s it in its own step", (_, change) => {
    room.setBackground("data:image/webp;base64,BBBB");
    change();
    const background = room.imagesMap.get(BACKGROUND_IMAGE_ID);
    room.paintCell(0, 0, "#000");
    room.undoManager.undo();
    expect(room.cellsMap.size).toBe(0);
    expect(room.imagesMap.get(BACKGROUND_IMAGE_ID)).toBe(background);
  });
});
