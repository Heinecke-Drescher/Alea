import type { Stage as StageNode } from "konva/lib/Stage";
import type { DragEvent, RefObject } from "react";
import { useFogGuard } from "../fog/useFogGuard";
import { showRoomSpaceError } from "../images/showRoomSpaceError";
import { usePlayer } from "../player/PlayerContext";
import { CELL_SIZE, cellAt, containsCell } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import { droppedTokenId, isTokenDrag } from "../tokens/tokenDrag";
import { dropPointOnMap } from "./dropPoint";

export function useTokenDrop(
  stageRef: RefObject<StageNode | null>,
  onCopied: (tokenId: string) => void,
) {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const { isDm } = usePlayer();

  function allowTokenDrop(event: DragEvent<HTMLElement>) {
    if (isTokenDrag(event.dataTransfer)) event.preventDefault();
  }

  function copyDroppedToken(event: DragEvent<HTMLElement>) {
    const id = droppedTokenId(event.dataTransfer);
    if (!id) return;
    event.preventDefault();
    // Someone may have removed it while it was being dragged.
    const token = room.tokensMap.get(id);
    if (!token) return;
    const cell = cellAt(dropPointOnMap(stageRef.current, event));
    if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
    // A large token lands with its middle under the pointer.
    const corner = Math.floor((token.size - 1) / 2);
    const x = cell.x - corner;
    const y = cell.y - corner;
    const width = token.size * CELL_SIZE;
    const landing = {
      x: x * CELL_SIZE,
      y: y * CELL_SIZE,
      width,
      height: width,
    };
    if (fogGuard.hidesRect(landing)) return;
    try {
      const [copyId] = room.paste(
        room.copyItems({ strokes: [], tokens: [id] }),
        (x - token.x) * CELL_SIZE,
        (y - token.y) * CELL_SIZE,
        !isDm,
      ).tokens;
      if (copyId) onCopied(copyId);
    } catch (error) {
      showRoomSpaceError(error);
    }
  }

  return { onDragOver: allowTokenDrop, onDrop: copyDroppedToken };
}
