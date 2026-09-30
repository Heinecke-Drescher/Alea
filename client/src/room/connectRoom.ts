import { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";

export function connectRoom(roomId: string, doc: Y.Doc) {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const provider = new HocuspocusProvider({
    url: `${protocol}://${location.host}/sync`,
    name: roomId,
    document: doc,
  });
  return () => provider.destroy();
}
