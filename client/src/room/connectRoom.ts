import { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";

export type Awareness = NonNullable<HocuspocusProvider["awareness"]>;

export function connectRoom(roomId: string, doc: Y.Doc) {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const provider = new HocuspocusProvider({
    url: `${protocol}://${location.host}/sync`,
    name: roomId,
    document: doc,
  });
  const { awareness } = provider;
  if (!awareness) throw new Error("Provider has no awareness");
  return { awareness, disconnect: () => provider.destroy() };
}
