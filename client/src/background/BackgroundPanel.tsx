import { Button, Stack } from "@mantine/core";
import { createImage } from "../images/createImage";
import { ImageDropzone } from "../images/ImageDropzone";
import { useRoom } from "../room/RoomContext";
import { useBackgroundImage } from "../room/useBackgroundImage";

// Large enough to look sharp on big screens, small enough to sync quickly to every player.
const BACKGROUND_IMAGE_SIZE = { maxWidth: 2500, maxHeight: 2500 };

export function BackgroundPanel() {
  const room = useRoom();
  const hasBackground = useBackgroundImage() !== null;

  async function setBackground(file: File) {
    room.setBackground(await createImage(file, BACKGROUND_IMAGE_SIZE));
  }

  return (
    <Stack gap="xs">
      <ImageDropzone
        maxMegabytes={20}
        multiple={false}
        label="Drop a map background here or click to select"
        acceptLabel="Drop to set the background"
        onFile={setBackground}
      />
      {hasBackground && (
        <Button variant="subtle" color="red" onClick={room.removeBackground}>
          Remove background
        </Button>
      )}
    </Stack>
  );
}
