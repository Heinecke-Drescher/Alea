import type { Vector2d } from "konva/lib/types";
import { useState } from "react";
import type { Room } from "../../room/createRoom";
import { cellAt, clampCellToMap, containsCell } from "../../room/grid";
import type { BoardTool } from "./tool";

export interface FogFrame {
  from: Vector2d;
  to: Vector2d;
}

export function useFogTool(room: Room, action: "reveal" | "hide") {
  const [frame, setFrame] = useState<FogFrame | null>(null);
  const tool: BoardTool = {
    selectsItems: false,
    listensToStrokes: false,
    onDown({ point }) {
      const cell = cellAt(point);
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
      setFrame({ from: cell, to: cell });
    },
    onMove({ point }) {
      const to = clampCellToMap(cellAt(point), room.mapBounds());
      setFrame((current) => {
        if (!current || (current.to.x === to.x && current.to.y === to.y)) {
          return current;
        }
        return { ...current, to };
      });
    },
    onUp() {
      if (frame) {
        const apply = action === "reveal" ? room.revealCells : room.hideCells;
        apply(frame.from, frame.to);
      }
      setFrame(null);
    },
    onCancel() {
      setFrame(null);
    },
  };

  return { tool, frame };
}
