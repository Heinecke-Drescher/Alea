import { useCallback, useRef, useSyncExternalStore } from "react";
import type { Awareness } from "./connectRoom";

const NOTHING: never[] = [];

// `read` must stay the same between renders, because the snapshot is kept until the awareness changes.
export function useAwareness<T>(
  awareness: Awareness | null,
  read: (clientId: number, state: unknown) => T | null,
) {
  const snapshot = useRef<T[] | null>(null);

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

  function getSnapshot(): T[] {
    if (!awareness) return NOTHING;
    snapshot.current ??= Array.from(awareness.getStates())
      .filter(([clientId]) => clientId !== awareness.clientID)
      .map(([clientId, state]) => read(clientId, state))
      .filter((value) => value !== null);
    return snapshot.current;
  }

  return useSyncExternalStore(subscribe, getSnapshot);
}
