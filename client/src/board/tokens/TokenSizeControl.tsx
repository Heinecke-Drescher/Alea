import { ActionIcon, Group, Text } from "@mantine/core";
import { IconArrowsDiagonal, IconMinus, IconPlus } from "@tabler/icons-react";
import type { Room } from "../../room/createRoom";
import { MAX_TOKEN_SIZE, type Square } from "../../room/grid";
import { placeToken } from "../../room/map";
import { useY } from "../../room/useY";

interface TokenSizeControlProps {
  // The menu lies outside the room's context.
  room: Room;
  tokenId: string;
  allows: (square: Square) => boolean;
}

export function TokenSizeControl({
  room,
  tokenId,
  allows,
}: TokenSizeControlProps) {
  const token = useY(room.tokensMap)[tokenId];
  if (!token) return null;
  const { x, y } = token;
  const bounds = room.mapBounds();
  const largest = Math.min(MAX_TOKEN_SIZE, bounds.columns, bounds.rows);

  function squareOf(size: number) {
    return { ...placeToken(bounds, { x, y, size }, 0, 0), size };
  }

  function resizeTo(size: number) {
    room.resizeToken(tokenId, squareOf(size));
  }

  const canShrink = token.size > 1;
  const canGrow = token.size < largest && allows(squareOf(token.size + 1));

  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      px="xs"
      py={4}
      // The menu stays open for several steps; a click reaching its overlay would close it.
      onClick={(event) => event.stopPropagation()}
    >
      <Group gap="xs" wrap="nowrap">
        <IconArrowsDiagonal size={16} />
        <Text size="sm">Size</Text>
      </Group>
      <Group gap={4} wrap="nowrap">
        <ActionIcon
          variant="subtle"
          aria-label="Smaller"
          disabled={!canShrink}
          onClick={() => resizeTo(token.size - 1)}
        >
          <IconMinus size={16} />
        </ActionIcon>
        <Text size="sm" w={20} ta="center">
          {token.size}
        </Text>
        <ActionIcon
          variant="subtle"
          aria-label="Larger"
          disabled={!canGrow}
          onClick={() => resizeTo(token.size + 1)}
        >
          <IconPlus size={16} />
        </ActionIcon>
      </Group>
    </Group>
  );
}
