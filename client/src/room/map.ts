import { clamp } from "@mantine/hooks";
import {
  containsCell,
  DEFAULT_MAP_BOUNDS,
  isValidMapBounds,
  type MapBounds,
} from "../board/grid";
import type { RoomStore } from "./roomStore";

export type MapActions = ReturnType<typeof createMapActions>;

export function placeToken(
  bounds: MapBounds,
  token: { x: number; y: number; size: number },
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
  settingsMap,
  cellsMap,
  tokensMap,
}: RoomStore) {
  // Rooms created before maps could be resized have no stored bounds.
  function mapBounds() {
    return settingsMap.get("bounds") ?? DEFAULT_MAP_BOUNDS;
  }

  function resize(bounds: MapBounds) {
    if (!isValidMapBounds(bounds)) {
      throw new Error(`Invalid map bounds ${JSON.stringify(bounds)}`);
    }
    if (!fitsInto(bounds)) return false;
    settingsMap.set("bounds", bounds);
    return true;
  }

  // Strokes may stick out of the map, so only cells and tokens limit its bounds.
  function fitsInto(bounds: MapBounds) {
    return (
      Array.from(cellsMap.values()).every((cell) =>
        containsCell(bounds, cell.x, cell.y),
      ) &&
      Array.from(tokensMap.values()).every(
        (token) =>
          containsCell(bounds, token.x, token.y) &&
          containsCell(
            bounds,
            token.x + token.size - 1,
            token.y + token.size - 1,
          ),
      )
    );
  }

  return { mapBounds, resize };
}
