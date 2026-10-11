import { useState } from "react";
import type { Room } from "../../room/createRoom";
import { cellAt, containsCell } from "../../room/grid";
import { measurementCell, type Measurement } from "../measurement";
import type { BoardTool } from "./tool";

export function useMeasureTool(room: Room) {
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const tool: BoardTool = {
    selectsItems: false,
    listensToStrokes: false,
    onDown({ point }) {
      const cell = cellAt(point);
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
      setMeasurement({ from: cell, to: cell });
    },
    onMove({ point }) {
      const to = measurementCell(cellAt(point), room.mapBounds());
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
