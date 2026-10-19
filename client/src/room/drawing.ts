import { nanoid } from "nanoid";
import { containsCell, type MapBounds } from "./grid";
import {
  cellKey,
  type Cell,
  type RoomStore,
  type Stroke,
  type StrokeData,
} from "./roomStore";

export function shiftPoints(points: number[], dx: number, dy: number) {
  return points.map((value, i) => value + (i % 2 === 0 ? dx : dy));
}

export function isOverFog(stroke: StrokeData) {
  return stroke.overFog === true;
}

export function strokeData(
  { color, points }: StrokeData,
  overFog: boolean,
): StrokeData {
  return overFog ? { color, points, overFog } : { color, points };
}

export function newStroke(
  data: StrokeData,
  overFog: boolean,
): [string, Stroke] {
  const id = nanoid();
  return [id, { ...strokeData(data, overFog), id }];
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

  function addStroke(color: string, points: number[], overFog = false) {
    undoManager.stopCapturing();
    strokesMap.set(...newStroke({ color, points }, overFog));
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

  return {
    paintCell,
    eraseCell,
    addStroke,
    removeStroke,
    clearDrawings,
  };
}
