import { createContext, useContext } from "react";
import type { Room } from "./createRoom";

export const RoomContext = createContext<Room | null>(null);

export function useRoom() {
  const room = useContext(RoomContext);
  if (!room) throw new Error("useRoom must be used inside a RoomContext");
  return room;
}
