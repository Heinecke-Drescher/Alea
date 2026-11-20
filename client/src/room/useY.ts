import { useCallback, useRef, useSyncExternalStore } from "react";
import * as Y from "yjs";

export function useY<T>(yType: Y.Map<T>): Record<string, T>;
export function useY<T>(yType: Y.Array<T>): T[];
export function useY<T>(yType: Y.Map<T> | Y.Array<T>) {
  // Remembers its type, as the same component may be handed another room's map.
  const snapshot = useRef<{
    yType: Y.Map<T> | Y.Array<T>;
    value: Record<string, T> | T[];
  } | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const handleChange = () => {
        snapshot.current = null;
        onChange();
      };
      yType.observeDeep(handleChange);
      return () => yType.unobserveDeep(handleChange);
    },
    [yType],
  );

  function getSnapshot() {
    if (snapshot.current?.yType !== yType) {
      snapshot.current = {
        yType,
        value:
          yType instanceof Y.Array
            ? yType.toArray()
            : Object.fromEntries(yType.entries()),
      };
    }
    return snapshot.current.value;
  }

  return useSyncExternalStore(subscribe, getSnapshot);
}
