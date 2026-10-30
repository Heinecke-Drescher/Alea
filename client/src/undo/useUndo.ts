import { useCallback, useSyncExternalStore } from "react";
import { showRoomSpaceError } from "../images/showRoomSpaceError";
import type { Room } from "../room/createRoom";

export function undoStep(step: () => void) {
  try {
    step();
  } catch (error) {
    showRoomSpaceError(error);
  }
}

export function useUndoState({ undoManager }: Room) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      undoManager.on("stack-item-added", onChange);
      undoManager.on("stack-item-popped", onChange);
      undoManager.on("stack-cleared", onChange);
      return () => {
        undoManager.off("stack-item-added", onChange);
        undoManager.off("stack-item-popped", onChange);
        undoManager.off("stack-cleared", onChange);
      };
    },
    [undoManager],
  );
  return {
    canUndo: useSyncExternalStore(subscribe, () => undoManager.canUndo()),
    canRedo: useSyncExternalStore(subscribe, () => undoManager.canRedo()),
  };
}
