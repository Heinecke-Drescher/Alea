import type { Awareness } from "./connectRoom";
import { isPlayerColor, type PlayerColor } from "../playerColors";
import { useAwareness } from "./useAwareness";
import { isFiniteNumber, isRecord } from "../typeGuards";

interface Cursor {
  clientId: number;
  name: string;
  color: PlayerColor;
  x: number;
  y: number;
}

// Awareness states come from other players, so their shape is not trusted.
export function toCursor(clientId: number, state: unknown): Cursor | null {
  if (!isRecord(state)) return null;
  const { name, color, cursor } = state;
  if (typeof name !== "string" || !isPlayerColor(color)) return null;
  if (!isRecord(cursor)) return null;
  const { x, y } = cursor;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
  return { clientId, name, color, x, y };
}

export function useCursors(awareness: Awareness | null) {
  return useAwareness(awareness, toCursor);
}
