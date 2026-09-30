import {
  Avatar,
  CloseButton,
  Group,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import { embeddedImage } from "../room/createRoom";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";

const TOKEN_SIZES = ["1", "2", "3"];

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
          <SegmentedControl
            data={TOKEN_SIZES}
            value={String(token.size)}
            onChange={(size) => room.resizeToken(token.id, Number(size))}
            size="xs"
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
