import { MUSIC_KEY, validMusic } from "./music";
import { useSharedRoom } from "./RoomContext";
import { useY } from "./useY";

export function useMusic() {
  const room = useSharedRoom();
  return validMusic(useY(room.musicMap)[MUSIC_KEY]);
}
