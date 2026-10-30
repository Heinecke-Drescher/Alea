import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { usePlayer } from "../player/PlayerContext";
import { foggedCells } from "../room/fog";
import { useRoom } from "../room/RoomContext";
import { useFog } from "../room/useFog";

export function useClearDrawings() {
  const room = useRoom();
  const { isDm } = usePlayer();
  const fog = useFog();

  function clearDrawings() {
    modals.openConfirmModal({
      title: "Clear drawings",
      centered: true,
      children: (
        <Text size="sm">
          Remove all painted cells, lines and texts for everyone? Tokens stay.
        </Text>
      ),
      labels: { confirm: "Clear drawings", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: room.clearDrawings,
    });
  }

  return {
    // Clearing would also wipe what the fog hides from players.
    canClear: isDm || foggedCells(fog).length === 0,
    clearDrawings,
  };
}
