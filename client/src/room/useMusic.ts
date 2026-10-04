import { MUSIC_KEY, validMusic } from "./music";
import { useRoom } from "./RoomContext";
import { useY } from "./useY";

export function useMusic() {
  const room = useRoom();
  return validMusic(useY(room.musicMap)[MUSIC_KEY]);
}
