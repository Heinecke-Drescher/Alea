import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import type { Room } from "../../room/createRoom";
import { useGestureUndo } from "./gestureUndo";
import { cellsAlong } from "../../room/grid";
import type { BoardTool, ToolPointer } from "./tool";

export function useEraserTool(room: Room): BoardTool {
  // Mouse events skip cells when moving fast, so every cell since the last point is erased.
  const lastPoint = useRef<Vector2d | null>(null);
  const fogGuard = useFogGuard();
  const gesture = useGestureUndo(room);

  function erase({ point, event }: ToolPointer) {
    // Concurrent resizing can leave cells outside the map that still need erasing.
    for (const cell of cellsAlong(lastPoint.current ?? point, point)) {
      if (!fogGuard.hidesCell(cell.x, cell.y)) room.eraseCell(cell.x, cell.y);
    }
    lastPoint.current = point;
    const stage = event.target.getStage();
    if (!stage) throw new Error("Pointer event without stage");
    // At this point, not at the pointer, as a fast move hands several points along with one event.
    const id = stage
      .getIntersection(stage.getAbsoluteTransform().point(point))
      ?.id();
    if (!id) return;
    if (room.strokesMap.has(id)) room.removeStroke(id);
    if (room.textsMap.has(id)) room.removeText(id);
  }

  return {
    selectsItems: false,
    listensToDrawings: true,
    onDown(pointer) {
      gesture.begin();
      erase(pointer);
    },
    onMove(pointer) {
      if (lastPoint.current) erase(pointer);
    },
    onUp() {
      lastPoint.current = null;
      gesture.finish();
    },
    onCancel() {
      lastPoint.current = null;
      gesture.takeBack();
    },
  };
}
