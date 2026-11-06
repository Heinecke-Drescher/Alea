import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import type { Awareness } from "../room/connection/connectRoom";
import { DM_KEY, validDm } from "../room/dm";
import { isPlayerPresent, toPlayerId } from "../room/connection/playerId";
import type { DungeonMaster } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";
import { useAwareness } from "../room/connection/useAwareness";
import { useDm } from "../room/useDm";
import { usePlayer } from "../player/PlayerContext";

type DmState =
  | { kind: "none" }
  | { kind: "self" }
  | { kind: "other"; dm: DungeonMaster; isAway: boolean };

// Called where it stays mounted, as it keeps the DM's name in step with the player's.
export function useDmControl(awareness: Awareness | null) {
  const room = useRoom();
  const player = usePlayer();
  const dm = useDm();
  const presentPlayerIds = useAwareness(awareness, toPlayerId);
  const { id, name, isDm } = player;

  useEffect(() => {
    if (dm && isDm && name !== "" && dm.name !== name) {
      room.becomeDm({ playerId: id, name });
    }
  }, [dm, isDm, id, name, room]);

  function becomeDm() {
    room.becomeDm({ playerId: id, name });
  }

  // The DM may have come back while the dialog was open.
  function takeOverIfStillAway(awayDm: DungeonMaster) {
    if (!awareness) throw new Error("Take over DM without a connection");
    const current = validDm(room.rolesMap.get(DM_KEY));
    if (
      current?.playerId !== awayDm.playerId ||
      isPlayerPresent(awareness, awayDm.playerId)
    ) {
      notifications.show({
        message: "The DM is back or has changed, so nothing was taken over.",
      });
      return;
    }
    becomeDm();
  }

  function confirmTakeOver(awayDm: DungeonMaster) {
    modals.openConfirmModal({
      title: "Take over DM",
      centered: true,
      children: (
        <Text size="sm">
          {awayDm.name} is not in the room. Become the DM instead?
        </Text>
      ),
      labels: { confirm: "Become DM", cancel: "Cancel" },
      onConfirm: () => takeOverIfStillAway(awayDm),
    });
  }

  const state: DmState = !dm
    ? { kind: "none" }
    : isDm
      ? { kind: "self" }
      : { kind: "other", dm, isAway: !presentPlayerIds.includes(dm.playerId) };

  return {
    state,
    becomeDm,
    releaseDm: () => room.releaseDm(id),
    confirmTakeOver,
  };
}
