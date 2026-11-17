import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useCloseWatcher } from "../useCloseWatcher";

// Keeps a back gesture that would leave the room only once, so leaving takes a second one.
export function useLeaveGuard(isActive: boolean) {
  const [isArmed, setIsArmed] = useState(true);
  useCloseWatcher(isActive && isArmed, () => {
    setIsArmed(false);
    notifications.show({
      message: "Swipe back again to leave the room",
      autoClose: 3000,
    });
  });
  // The browser lets a page hold the back gesture again only after a tap, so the guard waits for one.
  useEffect(() => {
    if (isArmed) return;
    const arm = () => setIsArmed(true);
    window.addEventListener("pointerdown", arm, { capture: true, once: true });
    return () =>
      window.removeEventListener("pointerdown", arm, { capture: true });
  }, [isArmed]);
}
