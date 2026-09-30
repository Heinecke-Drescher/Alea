import { nanoid } from "nanoid";
import type * as Y from "yjs";
import type { DieSides } from "../../../shared/dice";
import { COLUMNS, ROWS } from "../board/grid";

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
}

export type Room = ReturnType<typeof createRoom>;

export function embeddedImage(value: string | undefined) {
  return value?.startsWith("data:image/") ? value : null;
}

const MAX_ROLLS = 50;

export function createRoom(doc: Y.Doc) {
  const tokensMap = doc.getMap<Token>("tokens");
  const imagesMap = doc.getMap<string>("images");
  const cellsMap = doc.getMap<Cell>("cells");
  const strokesMap = doc.getMap<Stroke>("strokes");
  const rollsArray = doc.getArray<Roll>("rolls");

  function addRoll(player: string, sides: DieSides, value: number) {
    doc.transact(() => {
      rollsArray.push([{ id: nanoid(), player, sides, value, at: Date.now() }]);
      const excess = rollsArray.length - MAX_ROLLS;
      if (excess > 0) rollsArray.delete(0, excess);
    });
  }

  function paintCell(x: number, y: number, color: string) {
    const key = `${x},${y}`;
    if (cellsMap.get(key)?.color === color) return;
    cellsMap.set(key, { x, y, color });
  }

  function eraseCell(x: number, y: number) {
    cellsMap.delete(`${x},${y}`);
  }

  function addStroke(color: string, points: number[]) {
    const id = nanoid();
    strokesMap.set(id, { id, color, points });
  }

  function removeStroke(id: string) {
    strokesMap.delete(id);
  }

  function clearDrawings() {
    doc.transact(() => {
      cellsMap.clear();
      strokesMap.clear();
    });
  }

  function addToken(name: string, imageDataUrl: string) {
    const id = nanoid();
    const imageId = nanoid();
    const { x, y } = findFreeCell();
    doc.transact(() => {
      imagesMap.set(imageId, imageDataUrl);
      tokensMap.set(id, { id, name, imageId, x, y, size: 1 });
    });
  }

  function moveToken(id: string, x: number, y: number) {
    updateToken(id, (token) => ({ ...token, x, y }));
  }

  function renameToken(id: string, name: string) {
    updateToken(id, (token) => ({ ...token, name }));
  }

  function resizeToken(id: string, size: number) {
    updateToken(id, (token) => ({
      ...token,
      size,
      x: Math.min(token.x, COLUMNS - size),
      y: Math.min(token.y, ROWS - size),
    }));
  }

  function removeToken(id: string) {
    const token = tokensMap.get(id);
    if (!token) return;
    doc.transact(() => {
      tokensMap.delete(id);
      imagesMap.delete(token.imageId);
    });
  }

  function updateToken(id: string, change: (token: Token) => Token) {
    const token = tokensMap.get(id);
    if (!token) return;
    tokensMap.set(id, change(token));
  }

  function findFreeCell() {
    const occupied = new Set(
      Array.from(tokensMap.values(), coveredCells).flat(),
    );
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        if (!occupied.has(`${x},${y}`)) return { x, y };
      }
    }
    throw new Error("No free cell left on the map");
  }

  return {
    doc,
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
    rollsArray,
    addRoll,
    paintCell,
    eraseCell,
    addStroke,
    removeStroke,
    clearDrawings,
    addToken,
    moveToken,
    renameToken,
    resizeToken,
    removeToken,
  };
}

function coveredCells(token: Token): string[] {
  const cells: string[] = [];
  for (let dy = 0; dy < token.size; dy++) {
    for (let dx = 0; dx < token.size; dx++) {
      cells.push(`${token.x + dx},${token.y + dy}`);
    }
  }
  return cells;
}
