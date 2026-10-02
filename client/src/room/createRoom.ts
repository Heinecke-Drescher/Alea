import { nanoid } from "nanoid";
import * as Y from "yjs";
import type { DieSides } from "../../../shared/dice";
import { CELL_SIZE, COLUMNS, ROWS } from "../board/grid";
import { strokeTouches, type Area } from "./strokeTouches";

export interface Token {
  id: string;
  name: string;
  imageId: string;
  x: number;
  y: number;
  size: number;
}

interface Cell {
  x: number;
  y: number;
  color: string;
}

interface Stroke {
  id: string;
  color: string;
  points: number[];
}

interface Roll {
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

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

const MAX_ROLLS = 50;
const CLEANUP = Symbol("cleanup");

export function createRoom(doc: Y.Doc) {
  const tokensMap = doc.getMap<Token>("tokens");
  const imagesMap = doc.getMap<string>("images");
  const cellsMap = doc.getMap<Cell>("cells");
  const strokesMap = doc.getMap<Stroke>("strokes");
  const rollsArray = doc.getArray<Roll>("rolls");
  // Tracks only local changes, so undo never reverts other players' work. Rolls stay final.
  const undoManager = new Y.UndoManager([
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
  ]);
  // Undo can restore a token that another player deleted together with its image.
  undoManager.on("stack-item-popped", removeTokensWithoutImage);

  function removeTokensWithoutImage() {
    doc.transact(() => {
      for (const token of tokensMap.values()) {
        if (!imagesMap.has(token.imageId)) tokensMap.delete(token.id);
      }
    }, CLEANUP);
  }

  function addRoll(player: string, sides: DieSides, value: number) {
    doc.transact(() => {
      rollsArray.push([{ id: nanoid(), player, sides, value, at: Date.now() }]);
      const excess = rollsArray.length - MAX_ROLLS;
      if (excess > 0) rollsArray.delete(0, excess);
    });
  }

  function paintCell(x: number, y: number, color: string) {
    const key = cellKey(x, y);
    if (cellsMap.get(key)?.color === color) return;
    cellsMap.set(key, { x, y, color });
  }

  function eraseCell(x: number, y: number) {
    cellsMap.delete(cellKey(x, y));
  }

  function addStroke(color: string, points: number[]) {
    undoManager.stopCapturing();
    const id = nanoid();
    strokesMap.set(id, { id, color, points });
  }

  function removeStroke(id: string) {
    strokesMap.delete(id);
  }

  function clearDrawings() {
    undoManager.stopCapturing();
    doc.transact(() => {
      cellsMap.clear();
      strokesMap.clear();
    });
  }

  function addToken(name: string, imageDataUrl: string) {
    undoManager.stopCapturing();
    const id = nanoid();
    const imageId = nanoid();
    const { x, y } = findFreeCell();
    doc.transact(() => {
      imagesMap.set(imageId, imageDataUrl);
      tokensMap.set(id, { id, name, imageId, x, y, size: 1 });
    });
  }

  function moveToken(id: string, x: number, y: number) {
    undoManager.stopCapturing();
    updateToken(id, (token) => ({ ...token, x, y }));
  }

  function renameToken(id: string, name: string) {
    updateToken(id, (token) => ({ ...token, name }));
  }

  function resizeToken(id: string, size: number) {
    undoManager.stopCapturing();
    updateToken(id, (token) => ({
      ...token,
      size,
      x: Math.min(token.x, COLUMNS - size),
      y: Math.min(token.y, ROWS - size),
    }));
  }

  function removeToken(id: string) {
    undoManager.stopCapturing();
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

  function moveArea(area: Area, dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    undoManager.stopCapturing();
    doc.transact(() => {
      moveCellsIn(area, dx, dy);
      moveTokensIn(area, dx, dy);
      moveStrokesIn(area, dx, dy);
    });
  }

  function moveCellsIn(area: Area, dx: number, dy: number) {
    const moved = Array.from(cellsMap.values()).filter((cell) =>
      hasCenterIn(area, cell.x, cell.y, 1),
    );
    for (const cell of moved) cellsMap.delete(cellKey(cell.x, cell.y));
    for (const cell of moved) {
      const x = cell.x + dx;
      const y = cell.y + dy;
      if (x < 0 || y < 0 || x >= COLUMNS || y >= ROWS) {
        throw new Error(
          `Cannot move cell ${cellKey(cell.x, cell.y)} off the map`,
        );
      }
      cellsMap.set(cellKey(x, y), { ...cell, x, y });
    }
  }

  function moveTokensIn(area: Area, dx: number, dy: number) {
    for (const token of tokensMap.values()) {
      if (!hasCenterIn(area, token.x, token.y, token.size)) continue;
      tokensMap.set(token.id, {
        ...token,
        x: Math.max(0, Math.min(token.x + dx, COLUMNS - token.size)),
        y: Math.max(0, Math.min(token.y + dy, ROWS - token.size)),
      });
    }
  }

  function moveStrokesIn(area: Area, dx: number, dy: number) {
    for (const stroke of strokesMap.values()) {
      if (!strokeTouches(stroke.points, area)) continue;
      strokesMap.set(stroke.id, {
        ...stroke,
        points: shiftPoints(stroke.points, dx * CELL_SIZE, dy * CELL_SIZE),
      });
    }
  }

  function moveStrokes(ids: string[], dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const id of ids) {
        const stroke = strokesMap.get(id);
        if (!stroke) continue;
        strokesMap.set(id, {
          ...stroke,
          points: shiftPoints(stroke.points, dx, dy),
        });
      }
    });
  }

  function findFreeCell() {
    const occupied = new Set(
      Array.from(tokensMap.values(), coveredCells).flat(),
    );
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        if (!occupied.has(cellKey(x, y))) return { x, y };
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
    undoManager,
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
    moveArea,
    moveStrokes,
  };
}

function shiftPoints(points: number[], dx: number, dy: number) {
  return points.map((value, i) => value + (i % 2 === 0 ? dx : dy));
}

function hasCenterIn(area: Area, x: number, y: number, size: number) {
  const centerX = (x + size / 2) * CELL_SIZE;
  const centerY = (y + size / 2) * CELL_SIZE;
  return (
    centerX >= area.x &&
    centerX <= area.x + area.width &&
    centerY >= area.y &&
    centerY <= area.y + area.height
  );
}

function coveredCells(token: Token): string[] {
  const cells: string[] = [];
  for (let dy = 0; dy < token.size; dy++) {
    for (let dx = 0; dx < token.size; dx++) {
      cells.push(cellKey(token.x + dx, token.y + dy));
    }
  }
  return cells;
}
