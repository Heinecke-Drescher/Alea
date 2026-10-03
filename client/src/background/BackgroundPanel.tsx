import { Button, Group } from "@mantine/core";
import { ImageFileButton } from "../images/ImageFileButton";
import { useRoom } from "../room/RoomContext";
import { useBackgroundImage } from "../room/useBackgroundImage";
import {
  BACKGROUND_FILE_MEGABYTES,
  setBackgroundFromFile,
} from "./setBackgroundFromFile";

export function BackgroundPanel() {
  const room = useRoom();
  const hasBackground = useBackgroundImage() !== null;

  return (
    <Group gap="xs" grow>
      <ImageFileButton
        label="Set background…"
        maxMegabytes={BACKGROUND_FILE_MEGABYTES}
        multiple={false}
        onFile={(file) => setBackgroundFromFile(room, file)}
      />
      {hasBackground && (
        <Button variant="subtle" color="red" onClick={room.removeBackground}>
          Remove background
        </Button>
      )}
    </Group>
  );
}
