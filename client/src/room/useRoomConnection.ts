import { useEffect, useState } from "react";
import * as Y from "yjs";
import { connectRoom, type Awareness } from "./connectRoom";
import { createRoom } from "./createRoom";

export function useRoomConnection(roomId: string) {
  const [room] = useState(() => createRoom(new Y.Doc()));
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const connection = connectRoom(roomId, room.doc, setIsSynced);
    // oxlint-disable-next-line react/set-state-in-effect -- the awareness only exists once the provider connects
    setAwareness(connection.awareness);
    return connection.disconnect;
  }, [roomId, room]);

  return { room, awareness, isSynced };
}
