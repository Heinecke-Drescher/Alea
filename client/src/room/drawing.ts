import { nanoid } from "nanoid";
import { containsCell, type MapBounds } from "../board/grid";
import { cellKey, type Cell, type RoomStore } from "./roomStore";

export function shiftPoints(points: number[], dx: number, dy: number) {
  return points.map((value, i) => value + (i % 2 === 0 ? dx : dy));
}

export function putCell(
  { cellsMap }: RoomStore,
  bounds: MapBounds,
  cell: Cell,
  dx: number,
  dy: number,
) {
  const x = cell.x + dx;
  const y = cell.y + dy;
  if (!containsCell(bounds, x, y)) {
    throw new Error(`Cannot put cell ${cellKey(cell.x, cell.y)} off the map`);
  }
  cellsMap.set(cellKey(x, y), { ...cell, x, y });
}

export function createDrawing({
  doc,
  cellsMap,
  strokesMap,
  undoManager,
}: RoomStore) {
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

  function deleteStrokes(ids: string[]) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const id of ids) strokesMap.delete(id);
    });
  }

  return {
    paintCell,
    eraseCell,
    addStroke,
    removeStroke,
    clearDrawings,
    moveStrokes,
    deleteStrokes,
  };
}
