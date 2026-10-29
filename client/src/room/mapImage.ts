import { isValidMapBounds, type MapBounds } from "./grid";
import { BOUNDS_KEY, type MapActions } from "./map";
import type { RoomStore } from "./roomStore";
import { embeddedImage } from "./tokens";

// The image is kept with the token images and its place with the map bounds, so undo covers
// both; token image ids never take this name.
export const MAP_IMAGE_KEY = "mapImage";

export interface MapImage {
  image: string;
  bounds: MapBounds;
}

export function validMapImage(
  image: string | undefined,
  bounds: MapBounds | undefined,
): MapImage | null {
  const dataUrl = embeddedImage(image);
  if (!dataUrl || !bounds || !isValidMapBounds(bounds)) return null;
  return { image: dataUrl, bounds };
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
    undoManager.stopCapturing();
    doc.transact(() => {
      settingsMap.set(BOUNDS_KEY, bounds);
      settingsMap.set(MAP_IMAGE_KEY, bounds);
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
