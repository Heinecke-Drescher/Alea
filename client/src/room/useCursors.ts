import { useCallback, useRef, useSyncExternalStore } from "react";
import type { Awareness } from "./connectRoom";

export interface Cursor {
  clientId: number;
  name: string;
  x: number;
  y: number;
}

const NO_CURSORS: Cursor[] = [];

// Awareness states come from other players, so their shape is not trusted.
export function toCursor(clientId: number, state: unknown): Cursor | null {
  if (typeof state !== "object" || state === null) return null;
  if (!("name" in state) || !("cursor" in state)) return null;
  const { name, cursor } = state;
  if (typeof name !== "string") return null;
  if (typeof cursor !== "object" || cursor === null) return null;
  if (!("x" in cursor) || !("y" in cursor)) return null;
  const { x, y } = cursor;
  if (typeof x !== "number" || !Number.isFinite(x)) return null;
  if (typeof y !== "number" || !Number.isFinite(y)) return null;
  return { clientId, name, x, y };
}

export function useCursors(awareness: Awareness | null) {
  const snapshot = useRef<Cursor[] | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      snapshot.current = null;
      if (!awareness) return () => {};
      const handleChange = () => {
        snapshot.current = null;
        onChange();
      };
      awareness.on("change", handleChange);
      return () => awareness.off("change", handleChange);
    },
    [awareness],
  );

  function getSnapshot() {
    if (!awareness) return NO_CURSORS;
    snapshot.current ??= Array.from(awareness.getStates())
      .filter(([clientId]) => clientId !== awareness.clientID)
      .map(([clientId, state]) => toCursor(clientId, state))
      .filter((cursor) => cursor !== null);
    return snapshot.current;
  }

  return useSyncExternalStore(subscribe, getSnapshot);
}
