import { DM_KEY, validDm } from "./dm";
import { useRoom } from "./RoomContext";
import { useY } from "./useY";

export function useDm() {
  const room = useRoom();
  return validDm(useY(room.rolesMap)[DM_KEY]);
}
