import { readLocalStorageValue, useLocalStorage } from "@mantine/hooks";
import { useCallback } from "react";
import {
  NO_RECENT_ROOMS,
  parseRecentRooms,
  removeRoom,
  visitRoom,
  type RecentRooms,
} from "./recentRoomList";

const STORAGE = {
  key: "alea-recent-rooms",
  defaultValue: NO_RECENT_ROOMS,
  deserialize: parseRecentRooms,
};

export function useRecentRooms() {
  const [recent, setRecent] = useLocalStorage<RecentRooms>({
    ...STORAGE,
    getInitialValueInEffect: false,
  });

  const remove = useCallback(
    (id: string) => setRecent((current) => removeRoom(current, id)),
    [setRecent],
  );

  return { rooms: recent.rooms, remove };
}

// A plain call instead of the hook, so an open room does not re-render when the list changes.
export function recordVisit(id: string) {
  const stored = readLocalStorageValue<RecentRooms>(STORAGE);
  localStorage.setItem(
    STORAGE.key,
    JSON.stringify(visitRoom(stored, id, Date.now())),
  );
}
