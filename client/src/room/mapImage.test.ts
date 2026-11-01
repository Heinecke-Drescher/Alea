import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { CELL_SIZE, MAX_MAP_CELLS } from "./grid";
import {
  MAP_IMAGE_KEY,
  snappedToCells,
  turnedClockwise,
  validMapImage,
} from "./mapImage";

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

function setImageOnMap() {
  room.resize({ x: 0, y: 0, columns: 24, rows: 16 });
  room.setMapImage(IMAGE, { width: 2400, height: 1600 });
}

describe("map image", () => {
  it("lays the image on the map, as wide as the map", () => {
    const bounds = { x: -3, y: 2, columns: 30, rows: 20 };
    room.resize(bounds);
    room.setMapImage(IMAGE, { width: 3000, height: 1000 });
    expect(room.mapBounds()).toEqual(bounds);
    expect(mapImage()).toEqual({
      image: IMAGE,
      place: {
        x: -3 * CELL_SIZE,
        y: 2 * CELL_SIZE,
        width: 30 * CELL_SIZE,
        height: 10 * CELL_SIZE,
        rotation: 0,
      },
    });
  });

  it("stretches only very narrow or wide images to an allowed size", () => {
    room.setMapImage(IMAGE, { width: 2500, height: 10 });
    expect(mapImage()?.place.height).toBe(CELL_SIZE);
    room.setMapImage(IMAGE, { width: 10, height: 2500 });
    expect(mapImage()?.place.height).toBe(2 * MAX_MAP_CELLS * CELL_SIZE);
  });

  it("undoes the image in one step and never the map size", () => {
    setImageOnMap();
    room.undoManager.undo();
    expect(mapImage()).toBeNull();
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
    expect(room.undoManager.canUndo()).toBe(false);
  });

  it("removes the image but keeps the map size", () => {
    setImageOnMap();
    room.removeMapImage();
    expect(mapImage()).toBeNull();
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
  });

  it("moves and scales the image in one undo step", () => {
    setImageOnMap();
    const before = mapImage()?.place;
    const place = {
      x: -12.5,
      y: 30,
      width: 1500,
      height: 1000,
      rotation: 0,
    } as const;
    expect(room.placeMapImage(place)).toBe(true);
    expect(mapImage()?.place).toEqual(place);
    room.undoManager.undo();
    expect(mapImage()?.place).toEqual(before);
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
  });

  it("places nothing once another player removed the image", () => {
    const place = {
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
      rotation: 0,
    } as const;
    expect(room.placeMapImage(place)).toBe(false);
    expect(room.settingsMap.has(MAP_IMAGE_KEY)).toBe(false);
  });

  it("throws on a place the image cannot have", () => {
    setImageOnMap();
    expect(() =>
      room.placeMapImage({ x: 0, y: 0, width: 10, height: 8, rotation: 0 }),
    ).toThrow("Invalid map image place");
  });

  it("turns the image clockwise around its top right corner", () => {
    const place = {
      x: 100,
      y: 50,
      width: 400,
      height: 200,
      rotation: 0,
    } as const;
    const turned = turnedClockwise(place);
    expect(turned).toEqual({
      x: 300,
      y: 50,
      width: 200,
      height: 400,
      rotation: 90,
    });
    expect(turned.x + turned.width).toBe(place.x + place.width);
    const fourTimes = turnedClockwise(turnedClockwise(turnedClockwise(turned)));
    expect(fourTimes).toEqual(place);
  });

  it("snaps the image to whole cells, at least one", () => {
    expect(
      snappedToCells({ x: -26, y: 74, width: 1224, height: 20, rotation: 90 }),
    ).toEqual({
      x: -CELL_SIZE,
      y: CELL_SIZE,
      width: 24 * CELL_SIZE,
      height: CELL_SIZE,
      rotation: 90,
    });
  });

  it("fits the map to the snapped image in one undo step", () => {
    setImageOnMap();
    const place = {
      x: 60,
      y: -40,
      width: 1530,
      height: 1020,
      rotation: 0,
    } as const;
    room.placeMapImage(place);
    expect(room.snapMapImage()).toBe("mapFitted");
    expect(mapImage()?.place).toEqual({
      x: CELL_SIZE,
      y: -CELL_SIZE,
      width: 31 * CELL_SIZE,
      height: 20 * CELL_SIZE,
      rotation: 0,
    });
    expect(room.mapBounds()).toEqual({ x: 1, y: -1, columns: 31, rows: 20 });
    room.undoManager.undo();
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
  });

  it("leaves no undo step when everything is snapped already", () => {
    setImageOnMap();
    room.undoManager.clear();
    expect(room.snapMapImage()).toBe("mapFitted");
    expect(room.undoManager.canUndo()).toBe(false);
  });

  it("snaps only the image when the map cannot take its size", () => {
    setImageOnMap();
    const small = { x: 0, y: 0, width: 400, height: 300, rotation: 0 } as const;
    room.placeMapImage(small);
    expect(room.snapMapImage()).toBe("sizeNotAllowed");
    expect(mapImage()?.place).toEqual(small);
    room.paintCell(23, 0, "#ff0000");
    const narrow = {
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
      rotation: 0,
    } as const;
    room.placeMapImage(narrow);
    expect(room.snapMapImage()).toBe("contentOutside");
    expect(mapImage()?.place).toEqual(narrow);
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
  });

  it("snaps nothing once another player removed the image", () => {
    setImageOnMap();
    room.removeMapImage();
    expect(room.snapMapImage()).toBe("noImage");
    expect(room.settingsMap.has(MAP_IMAGE_KEY)).toBe(false);
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
