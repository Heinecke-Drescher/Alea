import { useRef } from "react";
import type { Room } from "../../room/createRoom";
import { undoStep } from "../../undo/useUndo";

// Paint and eraser change the room while the pointer moves. A cancelled press, e.g. a touch that
// a second finger turns into moving the view, takes back what it changed.
export function useGestureUndo(room: Room) {
  const startDepth = useRef<number | null>(null);

  return {
    begin() {
      room.undoManager.stopCapturing();
      startDepth.current = room.undoManager.undoStack.length;
    },
    finish() {
      startDepth.current = null;
    },
    takeBack() {
      const start = startDepth.current;
      startDepth.current = null;
      if (start === null) return;
      const steps = room.undoManager.undoStack.length - start;
      if (steps === 0) return;
      // One message at most if the room is too full to bring erased items back.
      undoStep(() => {
        for (let step = 0; step < steps; step++) room.undo();
      });
      // Otherwise Redo would bring back what the press only started.
      room.undoManager.clear(false, true);
    },
  };
}
