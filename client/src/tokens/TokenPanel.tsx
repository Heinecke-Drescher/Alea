import { Stack } from "@mantine/core";
import { ImageDropzone } from "../images/ImageDropzone";
import { useRoom } from "../room/RoomContext";
import { addTokenFromFile, TOKEN_FILE_MEGABYTES } from "./addTokenFromFile";
import { TokenList } from "./TokenList";

export function TokenPanel() {
  const room = useRoom();

  return (
    <Stack>
      <ImageDropzone
        maxMegabytes={TOKEN_FILE_MEGABYTES}
        multiple
        label="Drop token images here or click to select"
        acceptLabel="Drop to add tokens"
        onFile={(file) => addTokenFromFile(room, file)}
      />
      <TokenList />
    </Stack>
  );
}
