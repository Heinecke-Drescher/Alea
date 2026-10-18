import { Button, Group, Switch, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { usePlayer } from "../player/PlayerContext";
import { useRoom } from "../room/RoomContext";
import { useFog } from "../room/useFog";

function confirmHideEverything(hideEverything: () => void) {
  modals.openConfirmModal({
    title: "Hide everything",
    centered: true,
    children: (
      <Text size="sm">Cover the whole map with fog again for all players?</Text>
    ),
    labels: { confirm: "Hide everything", cancel: "Cancel" },
    confirmProps: { color: "red" },
    onConfirm: hideEverything,
  });
}

export function FogPanel() {
  const room = useRoom();
  const { isDm } = usePlayer();
  const { enabled } = useFog();
  if (!isDm) return null;

  return (
    <Group justify="space-between">
      <Switch
        label="Fog of war"
        checked={enabled}
        onChange={(event) => room.setFogEnabled(event.currentTarget.checked)}
      />
      {enabled && (
        <Button
          variant="subtle"
          color="red"
          onClick={() => confirmHideEverything(room.hideEverything)}
        >
          Hide everything…
        </Button>
      )}
    </Group>
  );
}
