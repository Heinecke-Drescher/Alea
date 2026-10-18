import type { FogView } from "./fog";
import { useRoom } from "./RoomContext";
import { useMapBounds } from "./useMapBounds";
import { useY } from "./useY";

export function useFog(): FogView {
  const room = useRoom();
  return { bounds: useMapBounds(), fogged: useY(room.fogMap) };
}
