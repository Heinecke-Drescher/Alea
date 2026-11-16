import { useDm } from "../room/useDm";
import { usePlayer } from "./PlayerContext";

// Scenes, imports and the map image change the map for everyone, so with a DM only the DM may.
export function useCanChangeMap() {
  const dm = useDm();
  const { isDm } = usePlayer();
  return dm === null || isDm;
}
