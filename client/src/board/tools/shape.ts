import type { Vector2d } from "konva/lib/types";
import { useState } from "react";
import type { Room } from "../../room/createRoom";
import { cellAt, containsCell, snapToCorner } from "../../room/grid";
import type { ShapeKind } from "../../room/shapes";
import type { BoardTool } from "./tool";

export interface ShapeDraft {
  kind: ShapeKind;
  from: Vector2d;
  to: Vector2d;
}

export function useShapeTool(room: Room, kind: ShapeKind) {
  const [draft, setDraft] = useState<ShapeDraft | null>(null);
  const tool: BoardTool = {
    selectsItems: false,
    listensToStrokes: false,
    onDown({ point }) {
      const cell = cellAt(point);
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
      setDraft({ kind, from: snapToCorner(point), to: point });
    },
    onMove({ point }) {
      setDraft((current) => current && { ...current, to: point });
    },
    onUp() {
      setDraft(null);
    },
    onCancel() {
      setDraft(null);
    },
  };

  return { tool, draft };
}
