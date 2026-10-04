import { createContext, useContext } from "react";
import type { PlayerColor } from "../room/playerColors";
import { useDm } from "../room/useDm";

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
}

export const PlayerContext = createContext<Player | null>(null);

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error("usePlayer must be used inside a PlayerContext");
  const isDm = useDm()?.playerId === player.id;
  return { ...player, isDm };
}
