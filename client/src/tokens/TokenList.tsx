import {
  Avatar,
  CloseButton,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { useFogGuard } from "../fog/useFogGuard";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { useFocusToken } from "./focusToken";
import { useSelectedTokens } from "./selectedTokens";
import { startTokenDrag } from "./tokenDrag";

export function TokenList() {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const tokens = Object.values(useY(room.tokensMap)).filter(
    (token) => !fogGuard.hidesSquare(token),
  );
  const images = useY(room.imagesMap);
  const focusToken = useFocusToken();
  const selected = useSelectedTokens();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Stack gap={4}>
      {tokens.map((token) => {
        const isEditing = token.id === editingId;
        return (
          <Tooltip
            key={token.id}
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
              bg={
                selected.includes(token.id)
                  ? "var(--mantine-color-default-hover)"
                  : undefined
              }
              style={{ cursor: isEditing ? undefined : "pointer" }}
              // While editing, dragging selects text in the name instead.
              draggable={!isEditing}
              onDragStart={(event) =>
                startTokenDrag(event.dataTransfer, token.id)
              }
              onClick={() => focusToken(token.id)}
            >
              <Avatar src={embeddedImage(images[token.imageId])} size="sm" />
              {isEditing ? (
                <TextInput
                  value={token.name}
                  onChange={(event) =>
                    room.renameToken(token.id, event.target.value)
                  }
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "Escape") {
                      setEditingId(null);
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
                  onDoubleClick={() => setEditingId(token.id)}
                >
                  {token.name === "" ? "Unnamed" : token.name}
                </Text>
              )}
              <CloseButton
                onClick={(event) => {
                  event.stopPropagation();
                  room.removeToken(token.id);
                }}
                aria-label="Remove token"
              />
            </Group>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
