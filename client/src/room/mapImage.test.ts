import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { CELL_SIZE, MAX_MAP_CELLS, MIN_MAP_CELLS } from "./grid";
import {
  MAP_IMAGE_KEY,
  MAP_IMAGE_PLACE_KEY,
  snappedToCells,
  turnedClockwise,
  validMapImage,
} from "./mapImage";
import { IMAGE } from "./testRoom";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function mapImage() {
  return validMapImage(
    room.imagesMap.get(MAP_IMAGE_KEY),
    room.mapImageMap.get(MAP_IMAGE_PLACE_KEY),
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

  it("snaps a moved image and fits the map in one undo step", () => {
    setImageOnMap();
    const before = mapImage()?.place;
    const place = {
      x: 60,
      y: -40,
      width: 1530,
      height: 1020,
      rotation: 0,
    } as const;
    expect(room.placeMapImage(place)).toBe("mapFitted");
    expect(mapImage()?.place).toEqual({
      x: CELL_SIZE,
      y: -CELL_SIZE,
      width: 31 * CELL_SIZE,
      height: 20 * CELL_SIZE,
      rotation: 0,
    });
    expect(room.mapBounds()).toEqual({ x: 1, y: -1, columns: 31, rows: 20 });
    room.undoManager.undo();
    expect(mapImage()?.place).toEqual(before);
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
  });

  it("leaves no undo step when the image snaps back to where it was", () => {
    setImageOnMap();
    room.undoManager.clear();
    const place = mapImage()?.place;
    if (!place) throw new Error("No map image");
    expect(room.placeMapImage({ ...place, x: place.x + 10 })).toBe("mapFitted");
    expect(mapImage()?.place).toEqual(place);
    expect(room.undoManager.canUndo()).toBe(false);
  });

  it("snaps only the image when the map cannot take its size", () => {
    setImageOnMap();
    const small = { x: 0, y: 0, width: 400, height: 300, rotation: 0 } as const;
    expect(room.placeMapImage(small)).toBe("sizeNotAllowed");
    expect(mapImage()?.place).toEqual(small);
    room.paintCell(23, 0, "#ff0000");
    const narrow = {
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
      rotation: 0,
    } as const;
    expect(room.placeMapImage(narrow)).toBe("contentOutside");
    expect(mapImage()?.place).toEqual(narrow);
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
    expect(room.placeMapImage(place)).toBe("noImage");
    expect(room.mapImageMap.size).toBe(0);
  });

  it("scales the image to a width in cells, keeping its top left and shape", () => {
    setImageOnMap();
    room.undoManager.clear();
    expect(room.scaleMapImage(30)).toBe("mapFitted");
    expect(mapImage()?.place).toEqual({
      x: 0,
      y: 0,
      width: 30 * CELL_SIZE,
      height: 20 * CELL_SIZE,
      rotation: 0,
    });
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 30, rows: 20 });
    room.undoManager.undo();
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
    expect(room.undoManager.canUndo()).toBe(false);
  });

  it("rounds the height of a scaled image to whole cells", () => {
    room.resize({ x: 0, y: 0, columns: 24, rows: 16 });
    room.setMapImage(IMAGE, { width: 3000, height: 1000 });
    expect(room.scaleMapImage(31)).toBe("mapFitted");
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 31, rows: 10 });
  });

  it("scales a turned image by the width seen on the map", () => {
    setImageOnMap();
    const place = mapImage()?.place;
    if (!place) throw new Error("No map image");
    room.placeMapImage(turnedClockwise(place));
    expect(room.scaleMapImage(20)).toBe("mapFitted");
    expect(mapImage()?.place).toEqual({
      x: 8 * CELL_SIZE,
      y: 0,
      width: 20 * CELL_SIZE,
      height: 30 * CELL_SIZE,
      rotation: 90,
    });
  });

  it("changes nothing for a width the map cannot take", () => {
    setImageOnMap();
    room.undoManager.clear();
    const place = mapImage()?.place;
    expect(room.scaleMapImage(10)).toBe("sizeNotAllowed");
    room.paintCell(23, 0, "#ff0000");
    room.undoManager.clear();
    expect(room.scaleMapImage(20)).toBe("contentOutside");
    expect(mapImage()?.place).toEqual(place);
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 24, rows: 16 });
    expect(room.undoManager.canUndo()).toBe(false);
  });

  it("scales nothing once another player removed the image", () => {
    expect(room.scaleMapImage(20)).toBe("noImage");
    expect(room.mapImageMap.size).toBe(0);
  });

  it("throws on a width that is not whole or outside the map limits", () => {
    setImageOnMap();
    for (const columns of [MIN_MAP_CELLS - 1, MAX_MAP_CELLS + 1, 20.5]) {
      expect(() => room.scaleMapImage(columns)).toThrow(
        "Invalid map image width",
      );
    }
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
