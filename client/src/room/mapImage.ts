import type { IRect } from "konva/lib/types";
import { CELL_SIZE, isValidMapBounds, mapRect, MAX_MAP_CELLS } from "./grid";
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

function isMapImageSize(value: unknown): value is number {
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

export function mapImageRows(width: number, height: number, columns: number) {
  return Math.round((columns * height) / width);
}

export function createMapImage(
  { doc, imagesMap, settingsMap, undoManager }: RoomStore,
  { mapBounds, fitsInto }: MapActions,
) {
  // The map takes the image's size, and undo reverts both in one step.
  function setMapImage(image: string, columns: number, rows: number) {
    const { x, y } = mapBounds();
    const bounds = { x, y, columns, rows };
    if (!isValidMapBounds(bounds)) {
      throw new Error(`Invalid map image size ${columns} × ${rows}`);
    }
    if (!fitsInto(bounds)) return false;
    const place: MapImagePlace = { ...mapRect(bounds), rotation: 0 };
    undoManager.stopCapturing();
    doc.transact(() => {
      settingsMap.set(BOUNDS_KEY, bounds);
      settingsMap.set(MAP_IMAGE_KEY, place);
      imagesMap.set(MAP_IMAGE_KEY, image);
    });
    undoManager.stopCapturing();
    return true;
  }

  function removeMapImage() {
    undoManager.stopCapturing();
    doc.transact(() => {
      settingsMap.delete(MAP_IMAGE_KEY);
      imagesMap.delete(MAP_IMAGE_KEY);
    });
    undoManager.stopCapturing();
  }

  return { setMapImage, removeMapImage };
}
