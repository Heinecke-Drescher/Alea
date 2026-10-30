import { useEffect, useEffectEvent, useRef } from "react";

// Once the board has its size, and again once the room's own map has loaded; never later.
export function useFitOnOpen(
  fitMap: () => void,
  hasSize: boolean,
  isSynced: boolean,
) {
  const fitOnOpen = useEffectEvent(fitMap);
  const fittedWhenSynced = useRef<boolean | null>(null);

  useEffect(() => {
    if (!hasSize || fittedWhenSynced.current === isSynced) return;
    fittedWhenSynced.current = isSynced;
    fitOnOpen();
  }, [hasSize, isSynced]);
}
