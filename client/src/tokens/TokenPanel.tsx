import { Stack } from "@mantine/core";
import { useFogGuard } from "../fog/useFogGuard";
import { ImageFileButton } from "../images/ImageFileButton";
import { useRoom } from "../room/RoomContext";
import { addTokenFromFile, TOKEN_FILE_MEGABYTES } from "./addTokenFromFile";
import { TokenList } from "./TokenList";

export function TokenPanel() {
  const room = useRoom();
  const fogGuard = useFogGuard();

  return (
    <Stack>
      <ImageFileButton
        label="Add tokens…"
        maxMegabytes={TOKEN_FILE_MEGABYTES}
        multiple
        onFile={(file) =>
          addTokenFromFile(room, file, {
            blocked: fogGuard.blockedSquares(),
          })
        }
      />
      <TokenList />
    </Stack>
  );
}
