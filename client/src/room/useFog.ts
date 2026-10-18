import { FOG_KEY, fogEnabled, type FogView } from "./fog";
import { useRoom } from "./RoomContext";
import { useMapBounds } from "./useMapBounds";
import { useY } from "./useY";

export function useFog(): FogView {
  const room = useRoom();
  return {
    bounds: useMapBounds(),
    revealed: useY(room.revealedMap),
    enabled: fogEnabled(useY(room.fogMap)[FOG_KEY]),
  };
}
