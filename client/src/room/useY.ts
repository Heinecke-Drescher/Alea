import { useCallback, useRef, useSyncExternalStore } from "react";
import * as Y from "yjs";

export function useY<T>(yType: Y.Map<T>): Record<string, T>;
export function useY<T>(yType: Y.Array<T>): T[];
export function useY<T>(yType: Y.Map<T> | Y.Array<T>) {
  const snapshot = useRef<Record<string, T> | T[] | null>(null);

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
    snapshot.current ??=
      yType instanceof Y.Array
        ? yType.toArray()
        : Object.fromEntries(yType.entries());
    return snapshot.current;
  }

  return useSyncExternalStore(subscribe, getSnapshot);
}
