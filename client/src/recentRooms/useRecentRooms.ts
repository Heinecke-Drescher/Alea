import { useLocalStorage } from "@mantine/hooks";
import { useCallback } from "react";
import {
  NO_RECENT_ROOMS,
  parseRecentRooms,
  removeRoom,
  visitRoom,
  type RecentRooms,
} from "./recentRoomList";

export function useRecentRooms() {
  const [recent, setRecent] = useLocalStorage<RecentRooms>({
    key: "alea-recent-rooms",
    defaultValue: NO_RECENT_ROOMS,
    getInitialValueInEffect: false,
    deserialize: parseRecentRooms,
  });

  // Stable, so a room can record its visit in an effect without running it again.
  const visit = useCallback(
    (id: string) => setRecent((current) => visitRoom(current, id, Date.now())),
    [setRecent],
  );
  const remove = useCallback(
    (id: string) => setRecent((current) => removeRoom(current, id)),
    [setRecent],
  );

  return { rooms: recent.rooms, visit, remove };
}
