import * as Y from "yjs";
import type { DieSides } from "../../../shared/dice";
import type { MapBounds } from "./grid";

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
  sides: DieSides;
  value: number;
  at: number;
  // Where the die landed on the map, in pixels. Rolls made before dice were thrown onto the map have none.
  position?: { x: number; y: number };
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
  // Tracks only local changes, so undo never reverts other players' work. Rolls stay final,
  // and so do map bounds: undoing a resize could push others' new content off the map.
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
    undoManager,
  };
}
