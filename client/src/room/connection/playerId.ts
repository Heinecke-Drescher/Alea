import type { Awareness } from "./connectRoom";

export function isPlayerPresent(awareness: Awareness, playerId: string) {
  return Array.from(awareness.getStates()).some(
    ([clientId, state]) =>
      clientId !== awareness.clientID &&
      toPlayerId(clientId, state) === playerId,
  );
}

export function toPlayerId(_clientId: number, state: unknown) {
  if (typeof state !== "object" || state === null) return null;
  if (!("playerId" in state) || typeof state.playerId !== "string") {
    return null;
  }
  return state.playerId;
}
