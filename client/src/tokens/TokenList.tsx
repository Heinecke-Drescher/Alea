import {
  ActionIcon,
  Avatar,
  Box,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import { useState } from "react";
import { DragGhost } from "../DragGhost";
import { useFogGuard } from "../fog/useFogGuard";
import { isOutOfFight } from "../room/effects";
import type { Token } from "../room/roomStore";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { GHOST_SIZE, useScreenDrag } from "../useScreenDrag";
import { useDropToken } from "./dropToken";
import { useFocusToken } from "./focusToken";
import { useSelectedTokens } from "./selectedTokens";
import { TokenListBadges } from "./TokenListBadges";
import { useOpenTokenMenu } from "./tokenMenu";
import { startTokenDrag } from "./tokenDrag";

export function TokenList() {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const tokens = Object.values(useY(room.tokensMap)).filter(
    (token) => !fogGuard.hidesSquare(token),
  );
  const images = useY(room.imagesMap);
  const selected = useSelectedTokens();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (tokens.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No tokens yet. Add them with +, or drop images onto the map.
      </Text>
    );
  }

  return (
    <Stack gap={4}>
      {tokens.map((token) => (
        <TokenRow
          key={token.id}
          token={token}
          image={embeddedImage(images[token.imageId])}
          isSelected={selected.includes(token.id)}
          isEditing={token.id === editingId}
          onEdit={(isEditing) => setEditingId(isEditing ? token.id : null)}
        />
      ))}
    </Stack>
  );
}

interface TokenRowProps {
  token: Token;
  image: string | null;
  isSelected: boolean;
  isEditing: boolean;
  onEdit: (isEditing: boolean) => void;
}

function TokenRow({
  token,
  image,
  isSelected,
  isEditing,
  onEdit,
}: TokenRowProps) {
  const room = useRoom();
  const focusToken = useFocusToken();
  const openTokenMenu = useOpenTokenMenu();
  const dropToken = useDropToken();
  const { handlers, ghostStart, ghostRef, isClickIgnored } = useScreenDrag(
    (samples) => {
      const release = samples.at(-1);
      if (!release) throw new Error("Dropped token without a point");
      dropToken(token.id, release);
    },
  );
  const avatarFilter = isOutOfFight(token) ? "grayscale(1)" : undefined;

  return (
    <>
      <Tooltip
        label="Click to find, double-click to rename, drag for a copy"
        position="left"
        openDelay={500}
        disabled={isEditing}
      >
        <Group
          gap="xs"
          wrap="nowrap"
          p={4}
          bdrs="sm"
          bg={isSelected ? "var(--mantine-color-default-hover)" : undefined}
          style={{
            cursor: isEditing ? undefined : "pointer",
            // Moving up or down scrolls the list; moving sideways drags the token to the map.
            touchAction: "pan-y",
          }}
          // While editing, dragging selects text in the name instead.
          draggable={!isEditing}
          onDragStart={(event) => startTokenDrag(event.dataTransfer, token.id)}
          // The mouse keeps the browser's drag and drop, which also shows where it may drop.
          onPointerDown={(event) => {
            if (!isEditing && event.pointerType !== "mouse") {
              handlers.onPointerDown(event);
            }
          }}
          onPointerMove={handlers.onPointerMove}
          onPointerUp={handlers.onPointerUp}
          onPointerCancel={handlers.onPointerCancel}
          onClick={() => {
            if (!isClickIgnored()) focusToken(token.id);
          }}
          // While editing, the name field keeps the browser's own menu.
          onContextMenu={(event) => {
            if (!isEditing) openTokenMenu(token.id, event);
          }}
        >
          <Box pos="relative" style={{ flexShrink: 0 }}>
            <Avatar src={image} size="md" style={{ filter: avatarFilter }} />
            <TokenListBadges token={token} />
          </Box>
          {isEditing ? (
            <TextInput
              value={token.name}
              onChange={(event) =>
                room.renameToken(token.id, event.target.value)
              }
              onBlur={() => onEdit(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  onEdit(false);
                }
              }}
              onClick={(event) => event.stopPropagation()}
              aria-label="Token name"
              size="xs"
              flex={1}
              autoFocus
            />
          ) : (
            <Text
              size="sm"
              flex={1}
              truncate
              c={token.name === "" ? "dimmed" : undefined}
              onDoubleClick={() => onEdit(true)}
            >
              {token.name === "" ? "Unnamed" : token.name}
            </Text>
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={(event) => {
              event.stopPropagation();
              openTokenMenu(token.id, event);
            }}
            aria-label="Token menu"
          >
            <IconDots size={16} />
          </ActionIcon>
        </Group>
      </Tooltip>
      <DragGhost start={ghostStart} ref={ghostRef}>
        <Avatar
          src={image}
          size={GHOST_SIZE}
          style={{ filter: avatarFilter }}
        />
      </DragGhost>
    </>
  );
}
