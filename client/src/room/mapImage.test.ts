import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { CELL_SIZE, DEFAULT_MAP_BOUNDS } from "./grid";
import { MAP_IMAGE_KEY, mapImageRows, validMapImage } from "./mapImage";

const IMAGE = "data:image/webp;base64,AAAA";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function mapImage() {
  return validMapImage(
    room.imagesMap.get(MAP_IMAGE_KEY),
    room.settingsMap.get(MAP_IMAGE_KEY),
  );
}

describe("map image", () => {
  it("gives the map the image's size where the map is", () => {
    room.resize({ x: -3, y: 2, columns: 30, rows: 20 });
    expect(room.setMapImage(IMAGE, 24, 16)).toBe(true);
    const bounds = { x: -3, y: 2, columns: 24, rows: 16 };
    expect(room.mapBounds()).toEqual(bounds);
    expect(mapImage()).toEqual({
      image: IMAGE,
      place: {
        x: -3 * CELL_SIZE,
        y: 2 * CELL_SIZE,
        width: 24 * CELL_SIZE,
        height: 16 * CELL_SIZE,
        rotation: 0,
      },
    });
  });

  it("refuses a size that leaves cells or tokens off the map", () => {
    room.paintCell(25, 0, "#ff0000");
    expect(room.setMapImage(IMAGE, 20, 20)).toBe(false);
    expect(room.mapBounds()).toEqual(DEFAULT_MAP_BOUNDS);
    expect(mapImage()).toBeNull();
  });

  it("throws on a size the map cannot have", () => {
    expect(() => room.setMapImage(IMAGE, 5, 20)).toThrow(
      "Invalid map image size",
    );
  });

  it("undoes the image and the map size in one step", () => {
    room.setMapImage(IMAGE, 24, 16);
    room.undoManager.undo();
    expect(room.mapBounds()).toEqual(DEFAULT_MAP_BOUNDS);
    expect(mapImage()).toBeNull();
  });

  it("removes the image but keeps the map size", () => {
    room.setMapImage(IMAGE, 24, 16);
    room.removeMapImage();
    expect(mapImage()).toBeNull();
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
  });

  it("takes the rows from the image's aspect ratio, rounded", () => {
    expect(mapImageRows(2000, 1500, 20)).toBe(15);
    expect(mapImageRows(2000, 1530, 20)).toBe(15);
    expect(mapImageRows(2000, 1560, 20)).toBe(16);
  });

  it("ignores images from the web and invalid places", () => {
    const place = { x: -10.5, y: 0, width: 1000, height: 800, rotation: 90 };
    expect(validMapImage(IMAGE, place)).toEqual({ image: IMAGE, place });
    expect(validMapImage("https://example.com/map.png", place)).toBeNull();
    expect(validMapImage(IMAGE, { ...place, width: CELL_SIZE - 1 })).toBeNull();
    expect(validMapImage(IMAGE, { ...place, height: 10001 })).toBeNull();
    expect(validMapImage(IMAGE, { ...place, x: Infinity })).toBeNull();
    expect(validMapImage(IMAGE, { ...place, rotation: 45 })).toBeNull();
    expect(
      validMapImage(IMAGE, { x: 0, y: 0, columns: 20, rows: 20 }),
    ).toBeNull();
    expect(validMapImage(IMAGE, undefined)).toBeNull();
  });

  it("keeps only the known fields of the place", () => {
    const place = { x: 0, y: 0, width: 1000, height: 800, rotation: 0 };
    expect(validMapImage(IMAGE, { ...place, extra: 1 })?.place).toEqual(place);
  });
});
