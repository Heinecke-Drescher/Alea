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

export interface Clip {
  cells: Cell[];
  tokens: { name: string; image: string; x: number; y: number; size: number }[];
  strokes: { color: string; points: number[] }[];
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
    const moved = cellsIn(area);
    for (const cell of moved) cellsMap.delete(cellKey(cell.x, cell.y));
    for (const cell of moved) putCell(cell, dx, dy);
  }

  function moveTokensIn(area: Area, dx: number, dy: number) {
    for (const token of tokensIn(area)) {
      tokensMap.set(token.id, { ...token, ...placeToken(token, dx, dy) });
    }
  }

  function moveStrokesIn(area: Area, dx: number, dy: number) {
    for (const stroke of strokesIn(area)) {
      strokesMap.set(stroke.id, {
        ...stroke,
        points: shiftPoints(stroke.points, dx * CELL_SIZE, dy * CELL_SIZE),
      });
    }
  }

  function cellsIn(area: Area) {
    return Array.from(cellsMap.values()).filter((cell) =>
      hasCenterIn(area, cell.x, cell.y, 1),
    );
  }

  function tokensIn(area: Area) {
    return Array.from(tokensMap.values()).filter((token) =>
      hasCenterIn(area, token.x, token.y, token.size),
    );
  }

  function strokesIn(area: Area) {
    return Array.from(strokesMap.values()).filter((stroke) =>
      strokeTouches(stroke.points, area),
    );
  }

  function putCell(cell: Cell, dx: number, dy: number) {
    const x = cell.x + dx;
    const y = cell.y + dy;
    if (x < 0 || y < 0 || x >= COLUMNS || y >= ROWS) {
      throw new Error(`Cannot put cell ${cellKey(cell.x, cell.y)} off the map`);
    }
    cellsMap.set(cellKey(x, y), { ...cell, x, y });
  }

  function copyArea(area: Area): Clip {
    return {
      cells: cellsIn(area),
      tokens: tokensIn(area).flatMap(({ name, imageId, x, y, size }) => {
        const image = imagesMap.get(imageId);
        return image ? [{ name, image, x, y, size }] : [];
      }),
      strokes: strokesIn(area).map(({ color, points }) => ({ color, points })),
    };
  }

  function copyStrokes(ids: string[]): Clip {
    return {
      cells: [],
      tokens: [],
      strokes: ids.flatMap((id) => {
        const stroke = strokesMap.get(id);
        return stroke ? [{ color: stroke.color, points: stroke.points }] : [];
      }),
    };
  }

  function paste(clip: Clip, dx: number, dy: number) {
    const hasGridContent = clip.cells.length > 0 || clip.tokens.length > 0;
    const isWholeCells =
      Number.isInteger(dx / CELL_SIZE) && Number.isInteger(dy / CELL_SIZE);
    if (hasGridContent && !isWholeCells) {
      throw new Error("Cells and tokens can only be pasted in whole cells");
    }
    undoManager.stopCapturing();
    const strokeIds: string[] = [];
    doc.transact(() => {
      for (const cell of clip.cells) {
        putCell(cell, dx / CELL_SIZE, dy / CELL_SIZE);
      }
      for (const { image, ...token } of clip.tokens) {
        const id = nanoid();
        const imageId = nanoid();
        const position = placeToken(token, dx / CELL_SIZE, dy / CELL_SIZE);
        imagesMap.set(imageId, image);
        tokensMap.set(id, { ...token, ...position, id, imageId });
      }
      for (const { color, points } of clip.strokes) {
        const id = nanoid();
        strokeIds.push(id);
        strokesMap.set(id, { id, color, points: shiftPoints(points, dx, dy) });
      }
    });
    return strokeIds;
  }

  function deleteArea(area: Area) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const cell of cellsIn(area)) {
        cellsMap.delete(cellKey(cell.x, cell.y));
      }
      for (const token of tokensIn(area)) {
        tokensMap.delete(token.id);
        imagesMap.delete(token.imageId);
      }
      for (const stroke of strokesIn(area)) strokesMap.delete(stroke.id);
    });
  }

  function deleteStrokes(ids: string[]) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const id of ids) strokesMap.delete(id);
    });
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
    copyArea,
    copyStrokes,
    paste,
    deleteArea,
    deleteStrokes,
  };
}

function shiftPoints(points: number[], dx: number, dy: number) {
  return points.map((value, i) => value + (i % 2 === 0 ? dx : dy));
}

function placeToken(
  token: { x: number; y: number; size: number },
  dx: number,
  dy: number,
) {
  return {
    x: Math.max(0, Math.min(token.x + dx, COLUMNS - token.size)),
    y: Math.max(0, Math.min(token.y + dy, ROWS - token.size)),
  };
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
