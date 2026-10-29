import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import type { Room } from "../../room/createRoom";
import { cellsAlong } from "../../room/grid";
import type { BoardTool, ToolPointer } from "./tool";

export function useEraserTool(room: Room): BoardTool {
  // Mouse events skip cells when moving fast, so every cell since the last point is erased.
  const lastPoint = useRef<Vector2d | null>(null);
  const fogGuard = useFogGuard();

  function erase({ point, event }: ToolPointer) {
    // Concurrent resizing can leave cells outside the map that still need erasing.
    for (const cell of cellsAlong(lastPoint.current ?? point, point)) {
      if (!fogGuard.hidesCell(cell.x, cell.y)) room.eraseCell(cell.x, cell.y);
    }
    lastPoint.current = point;
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer)
      throw new Error("Mouse event without stage pointer");
    const strokeId = stage.getIntersection(pointer)?.id();
    if (strokeId) room.removeStroke(strokeId);
  }

  return {
    selectsItems: false,
    listensToStrokes: true,
    onDown(pointer) {
      room.undoManager.stopCapturing();
      erase(pointer);
    },
    onMove(pointer) {
      if (lastPoint.current) erase(pointer);
    },
    onUp() {
      lastPoint.current = null;
    },
  };
}
