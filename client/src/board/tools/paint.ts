import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import type { Room } from "../../room/createRoom";
import { cellAt, containsCell } from "../../room/grid";
import type { BoardTool } from "./tool";

export function usePaintTool(room: Room, color: string): BoardTool {
  const pressed = useRef(false);
  const fogGuard = useFogGuard();

  function paint(point: Vector2d) {
    const cell = cellAt(point);
    if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
    if (fogGuard.hidesCell(cell.x, cell.y)) return;
    room.paintCell(cell.x, cell.y, color);
  }

  return {
    selectsItems: false,
    listensToStrokes: false,
    onDown({ point }) {
      room.undoManager.stopCapturing();
      pressed.current = true;
      paint(point);
    },
    onMove({ point }) {
      if (pressed.current) paint(point);
    },
    onUp() {
      pressed.current = false;
    },
  };
}
