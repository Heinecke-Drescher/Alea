import { Button, Stack } from "@mantine/core";
import { ImageDropzone } from "../images/ImageDropzone";
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
    <Stack gap="xs">
      <ImageDropzone
        maxMegabytes={BACKGROUND_FILE_MEGABYTES}
        multiple={false}
        label="Drop a map background here or click to select"
        acceptLabel="Drop to set the background"
        onFile={(file) => setBackgroundFromFile(room, file)}
      />
      {hasBackground && (
        <Button variant="subtle" color="red" onClick={room.removeBackground}>
          Remove background
        </Button>
      )}
    </Stack>
  );
}
