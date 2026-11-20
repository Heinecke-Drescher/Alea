import { clamp } from "@mantine/hooks";
import type { IRect } from "konva/lib/types";
import {
  CELL_SIZE,
  isValidMapBounds,
  mapRect,
  MAX_MAP_CELLS,
  MIN_MAP_CELLS,
  snapToCorner,
  type MapBounds,
} from "./grid";
import { BOUNDS_KEY, type MapActions } from "./map";
import { isFiniteNumber, isRecord } from "./typeGuards";
import type { RoomStore } from "./roomStore";
import { embeddedImage } from "./tokens";

// The image is kept with the token images, so undo and the room space check cover it; token
// image ids never take this name.
export const MAP_IMAGE_KEY = "mapImage";
export const MAP_IMAGE_PLACE_KEY = "place";

const MAP_IMAGE_ROTATIONS = [0, 90, 180, 270] as const;
type MapImageRotation = (typeof MAP_IMAGE_ROTATIONS)[number];

const MIN_MAP_IMAGE_SIZE = CELL_SIZE;
const MAX_MAP_IMAGE_SIZE = 2 * MAX_MAP_CELLS * CELL_SIZE;

// The rectangle is the one seen on the map, after turning the image.
export interface MapImagePlace extends IRect {
  rotation: MapImageRotation;
}

export interface MapImage {
  image: string;
  place: MapImagePlace;
}

function isMapImageRotation(value: unknown): value is MapImageRotation {
  return MAP_IMAGE_ROTATIONS.some((rotation) => rotation === value);
}

const NEXT_ROTATION: Record<MapImageRotation, MapImageRotation> = {
  0: 90,
  90: 180,
  180: 270,
  270: 0,
};

export function turnedClockwise({
  x,
  y,
  width,
  height,
  rotation,
}: MapImagePlace): MapImagePlace {
  return {
    x: x + width - height,
    y,
    width: height,
    height: width,
    rotation: NEXT_ROTATION[rotation],
  };
}

export const MAP_SIZE_LIMIT_MESSAGE = `Only the image snapped, as a map is ${MIN_MAP_CELLS} to ${MAX_MAP_CELLS} cells wide and high.`;

function isSamePlace(a: MapImagePlace, b: MapImagePlace) {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.rotation === b.rotation
  );
}

export function snappedToCells({
  x,
  y,
  width,
  height,
  rotation,
}: MapImagePlace): MapImagePlace {
  const toCellLength = (value: number) =>
    Math.max(1, Math.round(value / CELL_SIZE)) * CELL_SIZE;
  return {
    ...snapToCorner({ x, y }),
    width: toCellLength(width),
    height: toCellLength(height),
    rotation,
  };
}

function boundsOf({ x, y, width, height }: MapImagePlace): MapBounds {
  return {
    x: x / CELL_SIZE,
    y: y / CELL_SIZE,
    columns: width / CELL_SIZE,
    rows: height / CELL_SIZE,
  };
}

export function isMapImageSize(value: unknown): value is number {
  return (
    isFiniteNumber(value) &&
    value >= MIN_MAP_IMAGE_SIZE &&
    value <= MAX_MAP_IMAGE_SIZE
  );
}

// The place comes from other players or a file, so only its known fields are used.
export function validMapImagePlace(value: unknown): MapImagePlace | null {
  if (!isRecord(value)) return null;
  const { x, y, width, height, rotation } = value;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
  if (!isMapImageSize(width) || !isMapImageSize(height)) return null;
  if (!isMapImageRotation(rotation)) return null;
  return { x, y, width, height, rotation };
}

export function validMapImage(
  image: string | undefined,
  place: unknown,
): MapImage | null {
  const dataUrl = embeddedImage(image);
  const validPlace = validMapImagePlace(place);
  if (!dataUrl || !validPlace) return null;
  return { image: dataUrl, place: validPlace };
}

export function createMapImage(
  { doc, imagesMap, settingsMap, mapImageMap, undoManager }: RoomStore,
  { mapBounds, fitsInto }: MapActions,
) {
  // The image starts as wide as the map, so aligning it begins where the map is.
  function setMapImage(image: string, size: { width: number; height: number }) {
    const map = mapRect(mapBounds());
    const place: MapImagePlace = {
      x: map.x,
      y: map.y,
      width: map.width,
      height: clamp(
        (map.width * size.height) / size.width,
        MIN_MAP_IMAGE_SIZE,
        MAX_MAP_IMAGE_SIZE,
      ),
      rotation: 0,
    };
    undoManager.stopCapturing();
    doc.transact(() => {
      mapImageMap.set(MAP_IMAGE_PLACE_KEY, place);
      imagesMap.set(MAP_IMAGE_KEY, image);
    });
    undoManager.stopCapturing();
  }

  function mapFitFor(bounds: MapBounds) {
    if (!isValidMapBounds(bounds)) return "sizeNotAllowed";
    if (!fitsInto(bounds)) return "contentOutside";
    return "mapFitted";
  }

  function currentPlace() {
    if (!imagesMap.has(MAP_IMAGE_KEY)) return null;
    return validMapImagePlace(mapImageMap.get(MAP_IMAGE_PLACE_KEY));
  }

  // The image always snaps; the map follows it only where the map may take its size.
  function snapAndFit(place: MapImagePlace, current: MapImagePlace) {
    const snapped = snappedToCells(place);
    const bounds = boundsOf(snapped);
    const result = mapFitFor(bounds);
    const { x, y, columns, rows } = mapBounds();
    const isMapChanged =
      result === "mapFitted" &&
      (bounds.x !== x ||
        bounds.y !== y ||
        bounds.columns !== columns ||
        bounds.rows !== rows);
    // A click without moving must not leave an empty undo step.
    if (isSamePlace(snapped, current) && !isMapChanged) return result;
    undoManager.stopCapturing();
    doc.transact(() => {
      if (isMapChanged) settingsMap.set(BOUNDS_KEY, bounds);
      mapImageMap.set(MAP_IMAGE_PLACE_KEY, snapped);
    });
    undoManager.stopCapturing();
    return result;
  }

  // Another player may remove the image while it is being aligned.
  function placeMapImage(place: MapImagePlace) {
    if (!validMapImagePlace(place)) {
      throw new Error(`Invalid map image place ${JSON.stringify(place)}`);
    }
    const current = currentPlace();
    if (!current) return "noImage";
    return snapAndFit(place, current);
  }

  // The image brings its own grid, so its width in cells sets the scale; its top left stays.
  function scaleMapImage(columns: number) {
    if (
      !Number.isInteger(columns) ||
      columns < MIN_MAP_CELLS ||
      columns > MAX_MAP_CELLS
    ) {
      throw new Error(`Invalid map image width ${columns}`);
    }
    const current = currentPlace();
    if (!current) return "noImage";
    const width = columns * CELL_SIZE;
    const scaled = {
      ...current,
      width,
      height: (current.height * width) / current.width,
    };
    // Unlike a drag, a typed width that the map cannot take changes nothing.
    const result = mapFitFor(boundsOf(snappedToCells(scaled)));
    if (result !== "mapFitted") return result;
    return snapAndFit(scaled, current);
  }

  function removeMapImage() {
    undoManager.stopCapturing();
    doc.transact(() => {
      mapImageMap.delete(MAP_IMAGE_PLACE_KEY);
      imagesMap.delete(MAP_IMAGE_KEY);
    });
    undoManager.stopCapturing();
  }

  return { setMapImage, placeMapImage, scaleMapImage, removeMapImage };
}
