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
import { useFocusToken } from "./focusToken";
import { startTokenDrag } from "./tokenDrag";

export function TokenList() {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const tokens = Object.values(useY(room.tokensMap)).filter(
    (token) => !fogGuard.hidesSquare(token),
  );
  const images = useY(room.imagesMap);
  const focusToken = useFocusToken();

  return (
    <Stack gap="xs">
      {tokens.map((token) => (
        <Group key={token.id} gap="xs" wrap="nowrap">
          <Tooltip
            label="Click to find on the map, drag for a copy"
            position="left"
          >
            <Avatar
              src={embeddedImage(images[token.imageId])}
              size="sm"
              onClick={() => focusToken(token.id)}
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
