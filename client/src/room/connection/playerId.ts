import type { Awareness } from "./connectRoom";
import { isRecord } from "../typeGuards";

export function isPlayerPresent(
  awareness: Pick<Awareness, "clientID" | "getStates">,
  playerId: string,
) {
  return Array.from(awareness.getStates()).some(
    ([clientId, state]) =>
      clientId !== awareness.clientID &&
      toPlayerId(clientId, state) === playerId,
  );
}

export function toPlayerId(_clientId: number, state: unknown) {
  if (!isRecord(state) || typeof state.playerId !== "string") return null;
  return state.playerId;
}
