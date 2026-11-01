import { clamp } from "@mantine/hooks";
import type { IRect } from "konva/lib/types";
import {
  CELL_SIZE,
  isValidMapBounds,
  mapRect,
  MAX_MAP_CELLS,
  MIN_MAP_CELLS,
  type MapBounds,
} from "./grid";
import { BOUNDS_KEY, type MapActions } from "./map";
import { isFiniteNumber } from "./numbers";
import type { RoomStore } from "./roomStore";
import { embeddedImage } from "./tokens";

// The image is kept with the token images and its place with the map bounds, so undo covers
// both; token image ids never take this name.
export const MAP_IMAGE_KEY = "mapImage";

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

// The top right corner stays, so the rotate button there stays under the mouse.
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

export function isSamePlace(a: MapImagePlace, b: MapImagePlace) {
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
  const toCellLine = (value: number) =>
    Math.round(value / CELL_SIZE) * CELL_SIZE;
  const toCellLength = (value: number) =>
    Math.max(1, Math.round(value / CELL_SIZE)) * CELL_SIZE;
  return {
    x: toCellLine(x),
    y: toCellLine(y),
    width: toCellLength(width),
    height: toCellLength(height),
    rotation,
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
  if (typeof value !== "object" || value === null) return null;
  const { x, y, width, height, rotation } = value as Partial<
    Record<keyof MapImagePlace, unknown>
  >;
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
  { doc, imagesMap, settingsMap, undoManager }: RoomStore,
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
      settingsMap.set(MAP_IMAGE_KEY, place);
      imagesMap.set(MAP_IMAGE_KEY, image);
    });
    undoManager.stopCapturing();
  }

  // Another player may remove the image while it is being aligned.
  function placeMapImage(place: MapImagePlace) {
    if (!validMapImagePlace(place)) {
      throw new Error(`Invalid map image place ${JSON.stringify(place)}`);
    }
    if (!imagesMap.has(MAP_IMAGE_KEY)) return false;
    undoManager.stopCapturing();
    settingsMap.set(MAP_IMAGE_KEY, place);
    undoManager.stopCapturing();
    return true;
  }

  function mapFitFor(bounds: MapBounds) {
    if (!isValidMapBounds(bounds)) return "sizeNotAllowed";
    if (!fitsInto(bounds)) return "contentOutside";
    return "mapFitted";
  }

  function snapMapImage() {
    const place = validMapImagePlace(settingsMap.get(MAP_IMAGE_KEY));
    if (!imagesMap.has(MAP_IMAGE_KEY) || !place) return "noImage";
    const snapped = snappedToCells(place);
    const bounds = {
      x: snapped.x / CELL_SIZE,
      y: snapped.y / CELL_SIZE,
      columns: snapped.width / CELL_SIZE,
      rows: snapped.height / CELL_SIZE,
    };
    const result = mapFitFor(bounds);
    const { x, y, columns, rows } = mapBounds();
    const isMapChanged =
      result === "mapFitted" &&
      (bounds.x !== x ||
        bounds.y !== y ||
        bounds.columns !== columns ||
        bounds.rows !== rows);
    // Snapping what already fits must not leave an empty undo step.
    if (isSamePlace(snapped, place) && !isMapChanged) return result;
    undoManager.stopCapturing();
    doc.transact(() => {
      if (isMapChanged) settingsMap.set(BOUNDS_KEY, bounds);
      settingsMap.set(MAP_IMAGE_KEY, snapped);
    });
    undoManager.stopCapturing();
    return result;
  }

  function removeMapImage() {
    undoManager.stopCapturing();
    doc.transact(() => {
      settingsMap.delete(MAP_IMAGE_KEY);
      imagesMap.delete(MAP_IMAGE_KEY);
    });
    undoManager.stopCapturing();
  }

  return { setMapImage, placeMapImage, snapMapImage, removeMapImage };
}
