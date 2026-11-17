import { useEffect, useEffectEvent } from "react";

// Not yet in TypeScript's DOM types.
declare global {
  class CloseWatcher extends EventTarget {
    destroy(): void;
  }
}

// While open, the phone's back gesture calls `onClose` instead of leaving the page; the newest
// watcher goes first. Browsers without close watchers, e.g. Safari, leave the page as before.
export function useCloseWatcher(isOpen: boolean, onClose: () => void) {
  const close = useEffectEvent(onClose);
  useEffect(() => {
    if (!isOpen || !("CloseWatcher" in window)) return;
    const watcher = new CloseWatcher();
    watcher.addEventListener("close", () => close());
    return () => watcher.destroy();
  }, [isOpen]);
}
