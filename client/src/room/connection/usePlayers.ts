import { useMemo } from "react";
import { isPlayerColor, type PlayerColor } from "../playerColors";
import type { Awareness } from "./connectRoom";
import { useAwareness } from "./useAwareness";

export interface PresentPlayer {
  playerId: string;
  name: string;
  color: PlayerColor;
}

// Awareness states come from other players, so their shape is not trusted.
export function toPresentPlayer(
  _clientId: number,
  state: unknown,
): PresentPlayer | null {
  if (typeof state !== "object" || state === null) return null;
  if (!("playerId" in state) || !("name" in state) || !("color" in state)) {
    return null;
  }
  const { playerId, name, color } = state;
  if (typeof playerId !== "string" || playerId === "") return null;
  if (typeof name !== "string" || !isPlayerColor(color)) return null;
  return { playerId, name, color };
}

// A player with several tabs open is listed once.
export function uniquePlayers(players: PresentPlayer[]) {
  const byId = new Map<string, PresentPlayer>();
  for (const player of players) {
    if (!byId.has(player.playerId)) byId.set(player.playerId, player);
  }
  return Array.from(byId.values());
}

export function usePlayers(awareness: Awareness | null) {
  const players = useAwareness(awareness, toPresentPlayer);
  return useMemo(() => uniquePlayers(players), [players]);
}

export function otherPlayers(players: PresentPlayer[], ownId: string) {
  return players
    .filter((player) => player.playerId !== ownId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
