import { Stack, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import type { Room } from "../room/createRoom";
import { useRoom } from "../room/RoomContext";
import { createTokenImage } from "./createTokenImage";
import { TokenList } from "./TokenList";

const MAX_FILE_SIZE = 5 * 1024 ** 2;
const TOKEN_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

async function addTokenFromFile(room: Room, file: File) {
  try {
    const imageDataUrl = await createTokenImage(file);
    const name = file.name.replace(/\.[^.]+$/, "");
    room.addToken(name, imageDataUrl);
  } catch (error) {
    console.error(error);
    notifications.show({
      color: "red",
      title: `Could not add ${file.name}`,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function TokenPanel() {
  const room = useRoom();

  return (
    <Stack>
      <Dropzone
        accept={TOKEN_IMAGE_TYPES}
        maxSize={MAX_FILE_SIZE}
        onDrop={(files) =>
          files.forEach((file) => void addTokenFromFile(room, file))
        }
      >
        <Dropzone.Idle>
          <Text ta="center" c="dimmed">
            Drop token images here or click to select
          </Text>
        </Dropzone.Idle>
        <Dropzone.Accept>
          <Text ta="center">Drop to add tokens</Text>
        </Dropzone.Accept>
        <Dropzone.Reject>
          <Text ta="center" c="red">
            Only PNG, JPEG, WebP, GIF or AVIF up to 5 MB
          </Text>
        </Dropzone.Reject>
      </Dropzone>
      <TokenList />
    </Stack>
  );
}
