import { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";
import { ROOM_FULL_MESSAGE } from "../../../../shared/roomMessages";

export type Awareness = NonNullable<HocuspocusProvider["awareness"]>;
export type ConnectionState = "connecting" | "connected" | "disconnected";

interface RoomEvents {
  onSynced: (isSynced: boolean) => void;
  onConnectionChange: (state: ConnectionState) => void;
  onRoomFull: () => void;
}

export function connectRoom(
  roomId: string,
  doc: Y.Doc,
  { onSynced, onConnectionChange, onRoomFull }: RoomEvents,
) {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const provider = new HocuspocusProvider({
    url: `${protocol}://${location.host}/sync`,
    name: roomId,
    document: doc,
    // The provider reports only gaining the sync, never losing it.
    onSynced: ({ state }) => {
      onSynced(state);
      onConnectionChange("connected");
    },
    onClose: () => onConnectionChange("disconnected"),
    onAuthenticationFailed: () => onConnectionChange("disconnected"),
    onStateless: ({ payload }) => {
      if (payload !== ROOM_FULL_MESSAGE) return;
      // Reconnecting would send the data back that made the room too big.
      provider.disconnect();
      onRoomFull();
    },
  });
  const { awareness } = provider;
  if (!awareness) throw new Error("Provider has no awareness");
  return { awareness, disconnect: () => provider.destroy() };
}
