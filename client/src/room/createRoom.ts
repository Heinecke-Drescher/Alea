import type * as Y from "yjs";
import { createAreaActions } from "./areaActions";
import { createDrawing } from "./drawing";
import { createMapActions } from "./map";
import { createRolls } from "./rolls";
import { createRoomStore } from "./roomStore";
import { createTokens } from "./tokens";

export type Room = ReturnType<typeof createRoom>;

export function createRoom(doc: Y.Doc) {
  const store = createRoomStore(doc);
  const map = createMapActions(store);
  return {
    ...store,
    ...map,
    ...createRolls(store),
    ...createDrawing(store),
    ...createTokens(store, map),
    ...createAreaActions(store, map),
  };
}
