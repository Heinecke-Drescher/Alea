import { Badge, Button, Group, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import type { Awareness } from "../room/connectRoom";
import { DM_KEY, validDm } from "../room/dm";
import { isPlayerPresent, toPlayerId } from "../room/playerId";
import type { DungeonMaster } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";
import { useAwareness } from "../room/useAwareness";
import { useDm } from "../room/useDm";

interface DmControlProps {
  awareness: Awareness | null;
  playerId: string;
  playerName: string;
}

export function DmControl({ awareness, playerId, playerName }: DmControlProps) {
  const room = useRoom();
  const dm = useDm();
  const presentPlayerIds = useAwareness(awareness, toPlayerId);
  const isDm = dm?.playerId === playerId;

  useEffect(() => {
    if (isDm && dm.name !== playerName) {
      room.becomeDm({ playerId, name: playerName });
    }
  }, [isDm, dm, playerId, playerName, room]);

  function becomeDm() {
    room.becomeDm({ playerId, name: playerName });
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

  if (!dm) {
    return (
      <Button variant="light" size="xs" onClick={becomeDm}>
        Become DM
      </Button>
    );
  }

  if (isDm) {
    return (
      <Group gap="xs" wrap="nowrap">
        <Badge>DM</Badge>
        <Button
          variant="subtle"
          size="xs"
          color="gray"
          onClick={() => room.releaseDm(playerId)}
        >
          Release DM
        </Button>
      </Group>
    );
  }

  const isAway = !presentPlayerIds.includes(dm.playerId);
  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed">
        DM: {dm.name}
        {isAway && " (away)"}
      </Text>
      {isAway && (
        <Button variant="subtle" size="xs" onClick={() => confirmTakeOver(dm)}>
          Take over
        </Button>
      )}
    </Group>
  );
}
