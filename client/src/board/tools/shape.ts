import type { Vector2d } from "konva/lib/types";
import { useRef, useState } from "react";
import { usePlayer } from "../../player/PlayerContext";
import type { Room } from "../../room/createRoom";
import { cellAt, containsCell, snapToCorner } from "../../room/grid";
import { shapeCells, type AreaShape, type ShapeKind } from "../../room/shapes";
import { draggedEnd } from "./fingerOffset";
import type { BoardTool } from "./tool";

export function useShapeTool(
  room: Room,
  kind: ShapeKind,
  color: string,
  onPlaced: (id: string) => void,
) {
  const { isDm } = usePlayer();
  const [draft, setDraft] = useState<AreaShape | null>(null);
  // The ref lets a second onUp before the next render see that the shape is already placed.
  const draftRef = useRef<AreaShape | null>(null);
  const press = useRef<Vector2d>({ x: 0, y: 0 });

  function updateDraft(next: AreaShape | null) {
    draftRef.current = next;
    setDraft(next);
  }

  const tool: BoardTool = {
    selectsItems: false,
    listensToDrawings: false,
    onDown({ point }) {
      const cell = cellAt(point);
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
      press.current = point;
      updateDraft({ kind, from: snapToCorner(point), to: point });
    },
    onMove(pointer) {
      const current = draftRef.current;
      if (current)
        updateDraft({ ...current, to: draggedEnd(pointer, press.current) });
    },
    onUp() {
      const current = draftRef.current;
      updateDraft(null);
      if (current && shapeCells(current) > 0) {
        onPlaced(room.addShape(color, current, !isDm));
      }
    },
    onCancel() {
      updateDraft(null);
    },
  };

  return { tool, draft };
}
