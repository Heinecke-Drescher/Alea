import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import type { Room } from "../../room/createRoom";
import { cellsAlong, containsCell } from "../../room/grid";
import type { BoardTool } from "./tool";

export function usePaintTool(room: Room, color: string): BoardTool {
  // Mouse events skip cells when moving fast, so every cell since the last point is painted.
  const lastPoint = useRef<Vector2d | null>(null);
  const fogGuard = useFogGuard();

  function paint(point: Vector2d) {
    for (const cell of cellsAlong(lastPoint.current ?? point, point)) {
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) continue;
      if (fogGuard.hidesCell(cell.x, cell.y)) continue;
      room.paintCell(cell.x, cell.y, color);
    }
    lastPoint.current = point;
  }

  return {
    selectsItems: false,
    listensToDrawings: false,
    onDown({ point }) {
      room.undoManager.stopCapturing();
      paint(point);
    },
    onMove({ point }) {
      if (lastPoint.current) paint(point);
    },
    onUp() {
      lastPoint.current = null;
    },
  };
}
