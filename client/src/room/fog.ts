import type { IRect, Vector2d } from "konva/lib/types";
import { CELL_SIZE, cellAt, containsCell, type MapBounds } from "./grid";
import { toPoints } from "./points";
import { cellKey, type RoomStore } from "./roomStore";

export const FOG_KEY = "enabled";

export interface FogView {
  bounds: MapBounds;
  revealed: Record<string, unknown>;
  enabled: boolean;
}

// Cells off the map hold nothing hidden, so the fog never covers them.
export function isCellFogged(
  { bounds, revealed, enabled }: FogView,
  x: number,
  y: number,
) {
  return enabled && containsCell(bounds, x, y) && !(cellKey(x, y) in revealed);
}

export function rectTouchesFog(fog: FogView, rect: IRect) {
  const left = Math.floor(rect.x / CELL_SIZE);
  const top = Math.floor(rect.y / CELL_SIZE);
  const right = Math.ceil((rect.x + rect.width) / CELL_SIZE) - 1;
  const bottom = Math.ceil((rect.y + rect.height) / CELL_SIZE) - 1;
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (isCellFogged(fog, x, y)) return true;
    }
  }
  return false;
}

export function pointsTouchFog(fog: FogView, points: number[]) {
  return toPoints(points).some((point) => {
    const cell = cellAt(point);
    return isCellFogged(fog, cell.x, cell.y);
  });
}

export function fogEnabled(value: unknown) {
  return value === true;
}

export function foggedCells(fog: FogView) {
  if (!fog.enabled) return [];
  const { bounds } = fog;
  const cells: Vector2d[] = [];
  for (let y = bounds.y; y < bounds.y + bounds.rows; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.columns; x++) {
      if (isCellFogged(fog, x, y)) cells.push({ x, y });
    }
  }
  return cells;
}

function cellsBetween(from: Vector2d, to: Vector2d) {
  const cells: Vector2d[] = [];
  for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      cells.push({ x, y });
    }
  }
  return cells;
}

export function createFog({
  doc,
  revealedMap,
  fogMap,
  undoManager,
}: RoomStore) {
  function setFogEnabled(enabled: boolean) {
    fogMap.set(FOG_KEY, enabled);
  }

  function revealCells(from: Vector2d, to: Vector2d) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const { x, y } of cellsBetween(from, to)) {
        revealedMap.set(cellKey(x, y), { x, y });
      }
    });
  }

  function hideCells(from: Vector2d, to: Vector2d) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const { x, y } of cellsBetween(from, to)) {
        revealedMap.delete(cellKey(x, y));
      }
    });
  }

  function hideEverything() {
    undoManager.stopCapturing();
    revealedMap.clear();
  }

  return { setFogEnabled, revealCells, hideCells, hideEverything };
}
