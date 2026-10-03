import { Stack } from "@mantine/core";
import { ImageFileButton } from "../images/ImageFileButton";
import { useRoom } from "../room/RoomContext";
import { addTokenFromFile, TOKEN_FILE_MEGABYTES } from "./addTokenFromFile";
import { TokenList } from "./TokenList";

export function TokenPanel() {
  const room = useRoom();

  return (
    <Stack>
      <ImageFileButton
        label="Add tokens…"
        maxMegabytes={TOKEN_FILE_MEGABYTES}
        multiple
        onFile={(file) => addTokenFromFile(room, file)}
      />
      <TokenList />
    </Stack>
  );
}
