import { useRoom } from "./RoomContext";
import { useY } from "./useY";

export function useMapBounds() {
  const room = useRoom();
  useY(room.settingsMap);
  return room.mapBounds();
}
