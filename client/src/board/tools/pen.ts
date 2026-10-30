import { useState } from "react";
import { usePlayer } from "../../player/PlayerContext";
import type { Room } from "../../room/createRoom";
import type { BoardTool } from "./tool";

export function usePenTool(room: Room, color: string) {
  const { isDm } = usePlayer();
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const tool: BoardTool = {
    selectsItems: false,
    listensToDrawings: false,
    onDown({ point }) {
      setDraftPoints([point.x, point.y]);
    },
    onMove({ point }) {
      setDraftPoints((points) => points && [...points, point.x, point.y]);
    },
    onUp() {
      if (draftPoints && draftPoints.length >= 4) {
        room.addStroke(color, draftPoints, !isDm);
      }
      setDraftPoints(null);
    },
  };

  return { tool, draftPoints };
}
