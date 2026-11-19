import { usePlayer } from "./PlayerContext";

// Scenes, imports, the map image and the background change the map for everyone, so only the
// DM may. Without a DM nobody may, so players never see a scene being prepared.
export function useCanChangeMap() {
  return usePlayer().isDm;
}
