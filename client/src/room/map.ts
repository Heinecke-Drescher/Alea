import {
  containsCell,
  containsSquare,
  DEFAULT_MAP_BOUNDS,
  isValidMapBounds,
  validMapBounds,
  type MapBounds,
} from "./grid";
import { validCell } from "./drawing";
import { OUTSIDE_UNDO, validValues, type RoomStore } from "./roomStore";
import { validToken } from "./tokens";

export const BOUNDS_KEY = "bounds";
export const CONTENT_OUTSIDE_MESSAGE =
  "Move or delete what is outside the new size first.";

export type MapActions = ReturnType<typeof createMapActions>;

export function mapBounds({ settingsMap }: RoomStore) {
  return validMapBounds(settingsMap.get(BOUNDS_KEY)) ?? DEFAULT_MAP_BOUNDS;
}

export function createMapActions(store: RoomStore) {
  const { doc, settingsMap, cellsMap, tokensMap } = store;

  function resize(bounds: MapBounds) {
    if (!isValidMapBounds(bounds)) {
      throw new Error(`Invalid map bounds ${JSON.stringify(bounds)}`);
    }
    if (!fitsInto(bounds)) return false;
    doc.transact(() => settingsMap.set(BOUNDS_KEY, bounds), OUTSIDE_UNDO);
    return true;
  }

  // Strokes may stick out of the map, so only cells and tokens limit its bounds.
  function fitsInto(bounds: MapBounds) {
    return (
      validValues(cellsMap.entries(), validCell).every((cell) =>
        containsCell(bounds, cell.x, cell.y),
      ) &&
      validValues(tokensMap.entries(), validToken).every((token) =>
        containsSquare(bounds, token),
      )
    );
  }

  return { mapBounds: () => mapBounds(store), resize, fitsInto };
}
