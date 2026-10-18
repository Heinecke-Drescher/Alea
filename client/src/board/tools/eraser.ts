import { useRef } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import type { Room } from "../../room/createRoom";
import { cellAt } from "../../room/grid";
import type { BoardTool, ToolPointer } from "./tool";

export function useEraserTool(room: Room): BoardTool {
  const pressed = useRef(false);
  const fogGuard = useFogGuard();

  function erase({ point, event }: ToolPointer) {
    const cell = cellAt(point);
    // Concurrent resizing can leave cells outside the map that still need erasing.
    if (!fogGuard.hidesCell(cell.x, cell.y)) room.eraseCell(cell.x, cell.y);
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
      pressed.current = true;
      erase(pointer);
    },
    onMove(pointer) {
      if (pressed.current) erase(pointer);
    },
    onUp() {
      pressed.current = false;
    },
  };
}
