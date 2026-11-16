import type { Room } from "./createRoom";
import { CELL_SIZE } from "./grid";

export const IMAGE = "data:image/webp;base64,AAAA";

export function only<T>(values: Iterable<T>): T {
  const [value, ...rest] = values;
  if (value === undefined || rest.length > 0)
    throw new Error("Expected exactly one value");
  return value;
}

export function moveOnlyTokenTo(room: Room, x: number, y: number) {
  const token = only(room.tokensMap.values());
  room.moveItems(
    { strokes: [], tokens: [token.id], texts: [] },
    (x - token.x) * CELL_SIZE,
    (y - token.y) * CELL_SIZE,
  );
}
