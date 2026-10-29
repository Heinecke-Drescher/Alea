import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { MAX_ROOM_BYTES } from "../../../shared/roomLimits";
import { BACKGROUND_IMAGE_ID } from "./background";
import { createRoom, type Room } from "./createRoom";
import { MAP_IMAGE_KEY } from "./mapImage";

function imageOf(bytes: number) {
  return `data:image/webp;base64,${"A".repeat(bytes)}`;
}

const THREE_MB = imageOf(3 * 1024 ** 2);

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

describe("room space", () => {
  it("allows an image that fits", () => {
    expect(() => room.assertSpaceForImage(THREE_MB)).not.toThrow();
  });

  it("refuses an image that would make the room too large", () => {
    expect(() => room.assertSpaceForImage(imageOf(MAX_ROOM_BYTES))).toThrow(
      "Not enough space in this room for this image (0.0 of 5.0 MB used)",
    );
  });

  it("counts what is already in the room", () => {
    room.setBackground(THREE_MB);
    expect(() => room.assertSpaceForImage(THREE_MB)).toThrow(
      "(3.0 of 5.0 MB used)",
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
