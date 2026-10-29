import { Text } from "@mantine/core";
import { useFileDialog } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { usePlayer } from "../player/PlayerContext";
import type { Room } from "../room/createRoom";
import { useRoom } from "../room/RoomContext";
import { checkMapFileSize, parseMapFile, type MapFile } from "../room/roomFile";
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

export function useMapFiles() {
  const room = useRoom();
  const dm = useDm();
  const { isDm } = usePlayer();
  const fileDialog = useFileDialog({
    multiple: false,
    accept: ".json,application/json",
    onChange: (files) => {
      const file = files?.[0];
      if (file) void importFile(file);
    },
  });

  async function importFile(file: File) {
    let map: MapFile;
    try {
      checkMapFileSize(file.size);
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

  return {
    canImport: dm === null || isDm,
    exportMap: () => downloadMap(room),
    importMap: fileDialog.open,
  };
}
