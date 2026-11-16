import { createContext, useContext } from "react";
import type { Room } from "./createRoom";

// The room whose map is shown: a scene being prepared, otherwise the shared room. Most code is
// about the map, so new code that misses the shared room only changes what is prepared, never
// what the players see.
export const RoomContext = createContext<Room | null>(null);

// The room everyone shares, for what goes beyond the map: rolls, music, roles and scenes.
export const SharedRoomContext = createContext<Room | null>(null);

export function useRoom() {
  const room = useContext(RoomContext);
  if (!room) throw new Error("useRoom must be used inside a RoomContext");
  return room;
}

// Rolls land on the shared map, so a prepared one shows none.
export function useIsPreparing() {
  return useRoom() !== useSharedRoom();
}

export function useSharedRoom() {
  const room = useContext(SharedRoomContext);
  if (!room)
    throw new Error("useSharedRoom must be used inside a SharedRoomContext");
  return room;
}
