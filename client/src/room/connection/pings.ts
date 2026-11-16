import { isFiniteNumber, isRecord } from "../typeGuards";
import { isPlayerColor, type PlayerColor } from "../playerColors";

export interface Ping {
  clientId: number;
  color: PlayerColor;
  x: number;
  y: number;
  // Only tells pings of one player apart; clocks of other players may be off.
  at: number;
}

// Awareness states come from other players, so their shape is not trusted.
export function toPing(clientId: number, state: unknown): Ping | null {
  if (!isRecord(state)) return null;
  const { color, ping } = state;
  if (!isPlayerColor(color)) return null;
  if (!isRecord(ping)) return null;
  const { x, y, at } = ping;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(at)) {
    return null;
  }
  return { clientId, color, x, y, at };
}

export function pingKey({ clientId, at }: Ping) {
  return `${clientId}:${at}`;
}
