import type { Vector2d } from "konva/lib/types";
import { useRef, useState } from "react";
import type { Room } from "../../room/createRoom";
import { cellAt, clampCellToMap, containsCell } from "../../room/grid";
import { draggedEnd } from "./fingerOffset";
import type { Measurement } from "./measurement";
import type { BoardTool } from "./tool";

export function useMeasureTool(room: Room) {
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const press = useRef<Vector2d>({ x: 0, y: 0 });
  const tool: BoardTool = {
    selectsItems: false,
    listensToDrawings: false,
    onDown({ point }) {
      const cell = cellAt(point);
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
      press.current = point;
      setMeasurement({ from: cell, to: cell });
    },
    onMove(pointer) {
      const to = clampCellToMap(
        cellAt(draggedEnd(pointer, press.current)),
        room.mapBounds(),
      );
      setMeasurement((current) => {
        if (!current || (current.to.x === to.x && current.to.y === to.y)) {
          return current;
        }
        return { ...current, to };
      });
    },
    onUp() {
      setMeasurement(null);
    },
    onCancel() {
      setMeasurement(null);
    },
  };

  return { tool, measurement };
}
