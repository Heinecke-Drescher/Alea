import { Avatar, CloseButton, Group, Stack, TextInput } from "@mantine/core";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";

export function TokenList() {
  const room = useRoom();
  const tokens = Object.values(useY(room.tokensMap));
  const images = useY(room.imagesMap);

  return (
    <Stack gap="xs">
      {tokens.map((token) => (
        <Group key={token.id} gap="xs" wrap="nowrap">
          <Avatar src={embeddedImage(images[token.imageId])} size="sm" />
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
