import { Button, FileButton, Group, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useRef } from "react";
import { usePlayer } from "../player/PlayerContext";
import type { Room } from "../room/createRoom";
import { useRoom } from "../room/RoomContext";
import { parseMapFile, type MapFile } from "../room/roomFile";
import { useDm } from "../room/useDm";

function downloadMap(room: Room) {
  const json = JSON.stringify(room.exportMap());
  const url = URL.createObjectURL(
    new Blob([json], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `alea-map-${new Date().toISOString().slice(0, 10)}.alea.json`;
  link.click();
  // Some browsers start the download later and fail if the URL is already gone.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function confirmImport(onConfirm: () => void) {
  modals.openConfirmModal({
    title: "Import map",
    centered: true,
    children: <Text size="sm">Replace the map for everyone?</Text>,
    labels: { confirm: "Replace map", cancel: "Cancel" },
    confirmProps: { color: "red" },
    onConfirm,
  });
}

export function MapFileButtons() {
  const room = useRoom();
  const dm = useDm();
  const { isDm } = usePlayer();
  const resetRef = useRef<() => void>(null);
  const canImport = dm === null || isDm;

  async function importFile(file: File | null) {
    // Without a reset, picking the same file again fires no change.
    const reset = resetRef.current;
    if (!reset) throw new Error("Import button is not mounted");
    reset();
    if (!file) return;
    let map: MapFile;
    try {
      map = parseMapFile(await file.text());
    } catch (error) {
      notifications.show({
        color: "red",
        title: `Could not import ${file.name}`,
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    confirmImport(() => room.importMap(map));
  }

  return (
    <Group gap="xs" grow>
      <Button variant="light" onClick={() => downloadMap(room)}>
        Export map
      </Button>
      {canImport && (
        <FileButton
          resetRef={resetRef}
          accept=".json,application/json"
          onChange={(file) => void importFile(file)}
        >
          {(props) => (
            <Button variant="light" {...props}>
              Import map…
            </Button>
          )}
        </FileButton>
      )}
    </Group>
  );
}
