import { useRef } from "react";
import type { Room } from "../../room/createRoom";
import { undoStep } from "../../undo/useUndo";

// Paint and eraser change the room while the pointer moves. A cancelled press, e.g. a touch that
// a second finger turns into moving the view, takes back what it changed.
export function useGestureUndo(room: Room) {
  const startDepth = useRef<number | null>(null);

  return {
    begin() {
      startDepth.current = room.undoDepth();
    },
    finish() {
      startDepth.current = null;
    },
    takeBack() {
      const start = startDepth.current;
      startDepth.current = null;
      if (start === null) return;
      // One message at most if the room is too full to bring erased items back.
      undoStep(() => room.undoBackTo(start));
    },
  };
}
