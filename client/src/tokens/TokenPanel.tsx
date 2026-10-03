import { Stack } from "@mantine/core";
import { createImage } from "../images/createImage";
import { ImageDropzone } from "../images/ImageDropzone";
import { useRoom } from "../room/RoomContext";
import { TokenList } from "./TokenList";

const TOKEN_IMAGE_SIZE = { width: 128, height: 128, resize: "cover" } as const;

export function TokenPanel() {
  const room = useRoom();

  async function addToken(file: File) {
    const imageDataUrl = await createImage(file, TOKEN_IMAGE_SIZE);
    room.addToken(file.name.replace(/\.[^.]+$/, ""), imageDataUrl);
  }

  return (
    <Stack>
      <ImageDropzone
        maxMegabytes={5}
        multiple
        label="Drop token images here or click to select"
        acceptLabel="Drop to add tokens"
        onFile={addToken}
      />
      <TokenList />
    </Stack>
  );
}
