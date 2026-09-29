import {
  Avatar,
  CloseButton,
  Group,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import {
  imagesMap,
  removeToken,
  renameToken,
  resizeToken,
  tokensMap,
} from "../room/roomDoc";
import { useY } from "../room/useY";

const TOKEN_SIZES = ["1", "2", "3"];

export function TokenList() {
  const tokens = Object.values(useY(tokensMap));
  const images = useY(imagesMap);

  return (
    <Stack gap="xs">
      {tokens.map((token) => (
        <Group key={token.id} gap="xs" wrap="nowrap">
          <Avatar src={images[token.imageId]} size="sm" />
          <TextInput
            value={token.name}
            onChange={(event) => renameToken(token.id, event.target.value)}
            aria-label="Token name"
            size="xs"
            flex={1}
          />
          <SegmentedControl
            data={TOKEN_SIZES}
            value={String(token.size)}
            onChange={(size) => resizeToken(token.id, Number(size))}
            size="xs"
          />
          <CloseButton
            onClick={() => removeToken(token.id)}
            aria-label="Remove token"
          />
        </Group>
      ))}
    </Stack>
  );
}
