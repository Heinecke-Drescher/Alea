import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useCloseWatcher } from "../useCloseWatcher";

interface LeaveGuardProps {
  isActive: boolean;
  isDisconnected: boolean;
}

// Asks before a back gesture leaves the room. Back while asking means staying.
export function LeaveGuard({ isActive, isDisconnected }: LeaveGuardProps) {
  const navigate = useNavigate();
  const [isResting, setIsResting] = useState(false);
  const [dialogId, setDialogId] = useState<string | null>(null);

  const isAsking = dialogId !== null;
  useCloseWatcher(isActive && !isAsking && !isResting, () => {
    setDialogId(
      modals.openConfirmModal({
        title: "Leave room",
        children: <Text size="sm">Leave this room?</Text>,
        labels: { confirm: "Leave", cancel: "Stay" },
        // Opened from a link in a new tab, there is no page before the room.
        onConfirm: () =>
          window.history.length > 1 ? navigate(-1) : navigate("/"),
        onClose: () => {
          setDialogId(null);
          setIsResting(true);
        },
      }),
    );
  });
  useCloseWatcher(isAsking, () => {
    if (dialogId) modals.close(dialogId);
  });
  // Like the menu's "Leave room", so changes not yet sent are not left behind.
  useEffect(() => {
    if (!dialogId) return;
    modals.updateModal({
      modalId: dialogId,
      confirmProps: { disabled: isDisconnected },
    });
  }, [dialogId, isDisconnected]);
  // The dialog belongs to this room and goes with it.
  useEffect(() => {
    if (!dialogId) return;
    return () => modals.close(dialogId);
  }, [dialogId]);

  // The browser lets a page hold the back gesture again only after a tap, so the guard waits for one.
  useEffect(() => {
    if (!isResting) return;
    const arm = () => setIsResting(false);
    window.addEventListener("pointerdown", arm, { capture: true, once: true });
    return () =>
      window.removeEventListener("pointerdown", arm, { capture: true });
  }, [isResting]);

  return null;
}
