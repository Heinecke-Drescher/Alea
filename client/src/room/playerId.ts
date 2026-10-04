import { nanoid } from "nanoid";
import type { Awareness } from "./connectRoom";

const PLAYER_ID_KEY = "alea-player-id";

// Names can change or repeat, so the DM role is tied to this id kept in the browser.
export function localPlayerId() {
  const stored = localStorage.getItem(PLAYER_ID_KEY);
  if (stored) return stored;
  const id = nanoid();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}

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
