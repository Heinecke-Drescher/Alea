import { FOG_KEY, fogEnabled } from "./fog";
import { useRoom } from "./RoomContext";
import { useY } from "./useY";

export function useFog() {
  const room = useRoom();
  return {
    enabled: fogEnabled(useY(room.fogMap)[FOG_KEY]),
    revealed: useY(room.revealedMap),
  };
}
