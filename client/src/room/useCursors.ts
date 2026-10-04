import type { Awareness } from "./connectRoom";
import { isPlayerColor, type PlayerColor } from "./playerColors";
import { useAwareness } from "./useAwareness";

export interface Cursor {
  clientId: number;
  name: string;
  color: PlayerColor;
  x: number;
  y: number;
}

// Awareness states come from other players, so their shape is not trusted.
export function toCursor(clientId: number, state: unknown): Cursor | null {
  if (typeof state !== "object" || state === null) return null;
  if (!("name" in state) || !("color" in state) || !("cursor" in state)) {
    return null;
  }
  const { name, color, cursor } = state;
  if (typeof name !== "string" || !isPlayerColor(color)) return null;
  if (typeof cursor !== "object" || cursor === null) return null;
  if (!("x" in cursor) || !("y" in cursor)) return null;
  const { x, y } = cursor;
  if (typeof x !== "number" || !Number.isFinite(x)) return null;
  if (typeof y !== "number" || !Number.isFinite(y)) return null;
  return { clientId, name, color, x, y };
}

export function useCursors(awareness: Awareness | null) {
  return useAwareness(awareness, toCursor);
}
