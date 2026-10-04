import * as Y from "yjs";
import type { DieSides } from "../../../shared/dice";
import type { MapBounds } from "./grid";
import type { PlayerColor } from "./playerColors";

export interface Token {
  id: string;
  name: string;
  imageId: string;
  x: number;
  y: number;
  size: number;
}

export interface Cell {
  x: number;
  y: number;
  color: string;
}

export interface Stroke {
  id: string;
  color: string;
  points: number[];
}

export interface Roll {
  id: string;
  player: string;
  // Rolls made before players had colors have none.
  color?: PlayerColor;
  sides: DieSides;
  value: number;
  at: number;
  // Where a die dragged onto the map landed, in pixels. Clicked dice have none and land in each viewer's view.
  position?: { x: number; y: number };
  path?: number[];
}

// Seconds into the video at the time `at` (ms since epoch); while playing it moves on from there.
export interface Music {
  videoId: string;
  playing: boolean;
  position: number;
  at: number;
}

export interface DungeonMaster {
  playerId: string;
  name: string;
}

export type RoomStore = ReturnType<typeof createRoomStore>;

export function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

const CLEANUP = Symbol("cleanup");

export function createRoomStore(doc: Y.Doc) {
  const tokensMap = doc.getMap<Token>("tokens");
  const imagesMap = doc.getMap<string>("images");
  const cellsMap = doc.getMap<Cell>("cells");
  const strokesMap = doc.getMap<Stroke>("strokes");
  const rollsArray = doc.getArray<Roll>("rolls");
  const settingsMap = doc.getMap<MapBounds>("settings");
  const musicMap = doc.getMap<Music>("music");
  const rolesMap = doc.getMap<DungeonMaster>("roles");
  // Tracks only local changes, so undo never reverts other players' work. Rolls, music and roles
  // stay final, and so do map bounds: undoing a resize could push others' new content off the map.
  const undoManager = new Y.UndoManager([
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
  ]);

  // Undo can restore a token that another player deleted together with its image.
  undoManager.on("stack-item-popped", () => {
    doc.transact(() => {
      for (const token of tokensMap.values()) {
        if (!imagesMap.has(token.imageId)) tokensMap.delete(token.id);
      }
    }, CLEANUP);
  });

  return {
    doc,
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
    rollsArray,
    settingsMap,
    musicMap,
    rolesMap,
    undoManager,
  };
}
