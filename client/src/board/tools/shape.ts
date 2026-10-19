import type { Vector2d } from "konva/lib/types";
import { useRef, useState } from "react";
import { usePlayer } from "../../player/PlayerContext";
import type { Room } from "../../room/createRoom";
import { cellAt, containsCell, snapToCorner } from "../../room/grid";
import { shapeOutline, type ShapeKind } from "../../room/shapes";
import type { BoardTool } from "./tool";

export interface ShapeDraft {
  kind: ShapeKind;
  from: Vector2d;
  to: Vector2d;
}

export function useShapeTool(
  room: Room,
  kind: ShapeKind,
  color: string,
  onPlaced: (id: string) => void,
) {
  const { isDm } = usePlayer();
  const [draft, setDraft] = useState<ShapeDraft | null>(null);
  // The ref lets a second onUp before the next render see that the shape is already placed.
  const draftRef = useRef<ShapeDraft | null>(null);

  function updateDraft(next: ShapeDraft | null) {
    draftRef.current = next;
    setDraft(next);
  }

  const tool: BoardTool = {
    selectsItems: false,
    listensToStrokes: false,
    onDown({ point }) {
      const cell = cellAt(point);
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
      updateDraft({ kind, from: snapToCorner(point), to: point });
    },
    onMove({ point }) {
      const current = draftRef.current;
      if (current) updateDraft({ ...current, to: point });
    },
    onUp() {
      const current = draftRef.current;
      updateDraft(null);
      const outline =
        current && shapeOutline(current.kind, current.from, current.to);
      if (outline) onPlaced(room.addShape(color, outline, !isDm));
    },
    onCancel() {
      updateDraft(null);
    },
  };

  return { tool, draft };
}
