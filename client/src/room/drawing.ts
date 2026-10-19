import { nanoid } from "nanoid";
import { containsCell, type MapBounds } from "./grid";
import {
  cellKey,
  type Cell,
  type RoomStore,
  type Stroke,
  type StrokeData,
} from "./roomStore";
import {
  copyShape,
  fitShape,
  shapeOutline,
  shiftShape,
  type AreaShape,
} from "./shapes";

export function shiftPoints(points: number[], dx: number, dy: number) {
  return points.map((value, i) => value + (i % 2 === 0 ? dx : dy));
}

export function isOverFog(stroke: StrokeData) {
  return stroke.overFog === true;
}

export function isClosed(stroke: StrokeData) {
  return stroke.closed === true;
}

export function hasShapes(strokes: StrokeData[]) {
  return strokes.some(isClosed);
}

export function strokeData(stroke: StrokeData, overFog: boolean): StrokeData {
  return {
    color: stroke.color,
    points: stroke.points,
    ...(isClosed(stroke) && { closed: true }),
    ...(stroke.shape && { shape: copyShape(stroke.shape) }),
    ...(overFog && { overFog: true }),
  };
}

export function shiftStroke(stroke: StrokeData, dx: number, dy: number) {
  return {
    points: shiftPoints(stroke.points, dx, dy),
    ...(stroke.shape && { shape: shiftShape(stroke.shape, dx, dy) }),
  };
}

export function shapeStroke(
  shape: AreaShape,
): Pick<StrokeData, "points" | "closed" | "shape"> {
  const fitted = fitShape(shape);
  const points = shapeOutline(fitted.kind, fitted.from, fitted.to);
  if (!points) throw new Error("A shape needs a size");
  return { points, closed: true, shape: fitted };
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

  function addShape(color: string, shape: AreaShape, overFog: boolean) {
    undoManager.stopCapturing();
    const [id, stroke] = newStroke({ color, ...shapeStroke(shape) }, overFog);
    strokesMap.set(id, stroke);
    return id;
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
    addShape,
    removeStroke,
    clearDrawings,
  };
}
