import { clamp } from "@mantine/hooks";
import {
  containsCell,
  containsSquare,
  DEFAULT_MAP_BOUNDS,
  isValidMapBounds,
  type MapBounds,
  type Square,
} from "./grid";
import { OUTSIDE_UNDO, type RoomStore } from "./roomStore";

export const BOUNDS_KEY = "bounds";

export type MapActions = ReturnType<typeof createMapActions>;

export function placeToken(
  bounds: MapBounds,
  token: Square,
  dx: number,
  dy: number,
) {
  const { x, y, columns, rows } = bounds;
  return {
    x: clamp(token.x + dx, x, x + columns - token.size),
    y: clamp(token.y + dy, y, y + rows - token.size),
  };
}

export function createMapActions({
  doc,
  settingsMap,
  cellsMap,
  tokensMap,
}: RoomStore) {
  // Rooms created before maps could be resized have no stored bounds.
  function mapBounds() {
    return settingsMap.get(BOUNDS_KEY) ?? DEFAULT_MAP_BOUNDS;
  }

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
      Array.from(cellsMap.values()).every((cell) =>
        containsCell(bounds, cell.x, cell.y),
      ) &&
      Array.from(tokensMap.values()).every((token) =>
        containsSquare(bounds, token),
      )
    );
  }

  return { mapBounds, resize };
}
