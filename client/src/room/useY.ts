import { useCallback, useRef, useSyncExternalStore } from "react";
import type * as Y from "yjs";

export function useY<T>(yMap: Y.Map<T>): Record<string, T> {
  const snapshot = useRef<Record<string, T> | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const handleChange = () => {
        snapshot.current = null;
        onChange();
      };
      yMap.observeDeep(handleChange);
      return () => yMap.unobserveDeep(handleChange);
    },
    [yMap],
  );

  function getSnapshot() {
    snapshot.current ??= Object.fromEntries(yMap.entries());
    return snapshot.current;
  }

  return useSyncExternalStore(subscribe, getSnapshot);
}
