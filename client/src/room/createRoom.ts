import type * as Y from "yjs";
import { createAreaActions } from "./areaActions";
import { createBackground } from "./background";
import { createDm } from "./dm";
import { createDrawing } from "./drawing";
import { createFog } from "./fog";
import { createMapActions } from "./map";
import { createMapImage } from "./mapImage";
import { createMusic } from "./music";
import { createRolls } from "./rolls";
import { createMapFiles } from "./roomFile";
import { createRoomSpace } from "./roomSpace";
import { createRoomStore } from "./roomStore";
import { createScenes } from "./scenes";
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
    ...createBackground(store),
    ...createMapImage(store, map),
    ...createMusic(store),
    ...createDm(store),
    ...createFog(store),
    ...createMapFiles(store, map),
    ...createRoomSpace(store),
    ...createScenes(store),
  };
}
