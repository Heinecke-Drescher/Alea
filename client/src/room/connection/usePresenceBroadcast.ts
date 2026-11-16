import { useEffect } from "react";
import type { PlayerColor } from "../playerColors";
import type { Awareness } from "./connectRoom";

interface Presence {
  id: string;
  name: string;
  color: PlayerColor;
}

// Tells the others who is in the room, also while the map cannot be shown.
export function usePresenceBroadcast(
  awareness: Awareness | null,
  { id, name, color }: Presence,
) {
  useEffect(() => {
    awareness?.setLocalStateField("playerId", id);
    awareness?.setLocalStateField("name", name);
    awareness?.setLocalStateField("color", color);
  }, [awareness, id, name, color]);
}
