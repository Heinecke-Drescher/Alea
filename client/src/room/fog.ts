import type { Vector2d } from "konva/lib/types";
import type { MapBounds } from "./grid";
import { cellKey, type RoomStore } from "./roomStore";

export const FOG_KEY = "enabled";

export function fogEnabled(value: unknown) {
  return value === true;
}

export function foggedCells(
  bounds: MapBounds,
  revealed: Record<string, unknown>,
  enabled: boolean,
) {
  if (!enabled) return [];
  const cells: Vector2d[] = [];
  for (let y = bounds.y; y < bounds.y + bounds.rows; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.columns; x++) {
      if (!(cellKey(x, y) in revealed)) cells.push({ x, y });
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
