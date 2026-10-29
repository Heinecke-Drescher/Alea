import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { MAX_ROOM_BYTES } from "../../../shared/roomLimits";
import { BACKGROUND_IMAGE_ID } from "./background";
import { createRoom, type Room } from "./createRoom";
import { MAP_IMAGE_KEY } from "./mapImage";
import { megabytes, ROOM_SPACE_BYTES } from "./roomSpace";
import { OUTSIDE_UNDO } from "./roomStore";

function imageOf(bytes: number) {
  return `data:image/webp;base64,${"A".repeat(bytes)}`;
}

const TWO_MB = imageOf(2 * 1024 ** 2);
const THREE_MB = imageOf(3 * 1024 ** 2);
const LIMIT = megabytes(ROOM_SPACE_BYTES);

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

// Like another player's image: it takes space, but local undo never touches it.
function fillOutsideUndo(image: string) {
  room.doc.transact(() => room.imagesMap.set("filler", image), OUTSIDE_UNDO);
}

function onlyTokenId() {
  const [id] = room.tokensMap.keys();
  if (!id) throw new Error("No token in the room");
  return id;
}

describe("room space", () => {
  it("allows an image that fits", () => {
    expect(() => room.assertSpaceForImage(THREE_MB)).not.toThrow();
  });

  it("refuses an image that would make the room too large", () => {
    expect(() => room.assertSpaceForImage(imageOf(MAX_ROOM_BYTES))).toThrow(
      `Not enough space in this room for this image (0.0 of ${LIMIT} MB used)`,
    );
  });

  it("keeps a little space free below what the server saves", () => {
    expect(ROOM_SPACE_BYTES).toBeLessThan(MAX_ROOM_BYTES);
    expect(() =>
      room.assertSpaceForImage(imageOf(ROOM_SPACE_BYTES + 1000)),
    ).toThrow("Not enough space");
  });

  it("counts what is already in the room", () => {
    room.setBackground(THREE_MB);
    expect(() => room.assertSpaceForImage(THREE_MB)).toThrow(
      `(3.0 of ${LIMIT} MB used)`,
    );
  });

  it("frees the space of the image that gets replaced", () => {
    room.setBackground(THREE_MB);
    expect(() =>
      room.assertSpaceForImage(THREE_MB, BACKGROUND_IMAGE_ID),
    ).not.toThrow();
  });

  it("frees the space of a replaced map image", () => {
    room.setMapImage(THREE_MB, 20, 15);
    expect(() =>
      room.assertSpaceForImage(THREE_MB, MAP_IMAGE_KEY),
    ).not.toThrow();
  });

  it("does not count images kept only for undo", () => {
    room.setBackground(THREE_MB);
    room.removeBackground();
    expect(() => room.assertSpaceForImage(THREE_MB)).not.toThrow();
  });
});

describe("room space when copying tokens", () => {
  beforeEach(() => {
    room.addToken("Ogre", THREE_MB);
  });

  it("refuses to paste tokens without space and leaves the room as it was", () => {
    const clip = room.copyItems({ strokes: [], tokens: [onlyTokenId()] });
    expect(() => room.paste(clip, 50, 0)).toThrow(
      "Not enough space in this room for the copied tokens",
    );
    expect(room.tokensMap.size).toBe(1);
  });

  it("refuses to duplicate a token without space", () => {
    expect(() => room.duplicateToken(onlyTokenId())).toThrow(
      "the copied tokens",
    );
    expect(room.tokensMap.size).toBe(1);
  });

  it("pastes strokes into a full room", () => {
    room.addStroke("#000", [0, 0, 10, 10]);
    const [strokeId] = room.strokesMap.keys();
    if (!strokeId) throw new Error("No stroke in the room");
    fillOutsideUndo(TWO_MB);
    const clip = room.copyItems({ strokes: [strokeId], tokens: [] });
    expect(() => room.paste(clip, 10, 0)).not.toThrow();
  });
});

describe("room space on undo and redo", () => {
  it("takes back an undo that would overfill the room", () => {
    room.setBackground(THREE_MB);
    room.removeBackground();
    fillOutsideUndo(TWO_MB);
    expect(() => room.undo()).toThrow(
      "Not enough space in this room to bring this back",
    );
    expect(room.imagesMap.has(BACKGROUND_IMAGE_ID)).toBe(false);
  });

  it("can still undo the step once there is space again", () => {
    room.setBackground(THREE_MB);
    room.removeBackground();
    fillOutsideUndo(TWO_MB);
    expect(() => room.undo()).toThrow();
    room.doc.transact(() => room.imagesMap.delete("filler"), OUTSIDE_UNDO);
    room.undo();
    expect(room.imagesMap.get(BACKGROUND_IMAGE_ID)).toBe(THREE_MB);
  });

  it("takes back a redo that would overfill the room", () => {
    room.setBackground(THREE_MB);
    room.undo();
    fillOutsideUndo(TWO_MB);
    expect(() => room.redo()).toThrow("to bring this back");
    expect(room.imagesMap.has(BACKGROUND_IMAGE_ID)).toBe(false);
  });

  it("lets an undo through that does not grow a full room", () => {
    room.paintCell(0, 0, "#000");
    fillOutsideUndo(imageOf(ROOM_SPACE_BYTES));
    expect(() => room.undo()).not.toThrow();
    expect(room.cellsMap.size).toBe(0);
  });

  it("does nothing without a step to undo", () => {
    expect(() => room.undo()).not.toThrow();
    expect(() => room.redo()).not.toThrow();
  });
});
