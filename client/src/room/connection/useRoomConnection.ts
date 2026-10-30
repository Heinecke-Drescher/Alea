import { useEffect, useState } from "react";
import * as Y from "yjs";
import {
  connectRoom,
  type Awareness,
  type ConnectionState,
} from "./connectRoom";
import { createRoom } from "../createRoom";

export function useRoomConnection(roomId: string) {
  const [room] = useState(() => createRoom(new Y.Doc()));
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const roomConnection = connectRoom(roomId, room.doc, {
      onSynced: setIsSynced,
      onConnectionChange: setConnection,
      onRoomFull: () => setIsFull(true),
    });
    // oxlint-disable-next-line react/set-state-in-effect -- the awareness only exists once the provider connects
    setAwareness(roomConnection.awareness);
    return roomConnection.disconnect;
  }, [roomId, room]);

  return { room, awareness, isSynced, connection, isFull };
}
