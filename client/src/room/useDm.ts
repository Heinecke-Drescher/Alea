import { DM_KEY, validDm } from "./dm";
import { useSharedRoom } from "./RoomContext";
import { useY } from "./useY";

export function useDm() {
  const room = useSharedRoom();
  return validDm(useY(room.rolesMap)[DM_KEY]);
}
