import {
  Avatar,
  CloseButton,
  Group,
  Stack,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useFogGuard } from "../fog/useFogGuard";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { startTokenDrag } from "./tokenDrag";

export function TokenList() {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const tokens = Object.values(useY(room.tokensMap)).filter(
    (token) => !fogGuard.hidesSquare(token),
  );
  const images = useY(room.imagesMap);

  return (
    <Stack gap="xs">
      {tokens.map((token) => (
        <Group key={token.id} gap="xs" wrap="nowrap">
          <Tooltip label="Drag onto the map for a copy" position="left">
            <Avatar
              src={embeddedImage(images[token.imageId])}
              size="sm"
              draggable
              onDragStart={(event) =>
                startTokenDrag(event.dataTransfer, token.id)
              }
              style={{ cursor: "grab" }}
            />
          </Tooltip>
          <TextInput
            value={token.name}
            onChange={(event) => room.renameToken(token.id, event.target.value)}
            aria-label="Token name"
            size="xs"
            flex={1}
          />
          <CloseButton
            onClick={() => room.removeToken(token.id)}
            aria-label="Remove token"
          />
        </Group>
      ))}
    </Stack>
  );
}
