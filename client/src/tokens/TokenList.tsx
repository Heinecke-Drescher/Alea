import {
  ActionIcon,
  Avatar,
  Box,
  Group,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { IconDots, IconGripVertical } from "@tabler/icons-react";
import { Reorder, useDragControls } from "motion/react";
import { useRef, useState } from "react";
import { DragGhost } from "../DragGhost";
import { useFogGuard } from "../fog/useFogGuard";
import { isOutOfFight } from "../room/effects";
import type { Token } from "../room/roomStore";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useTokens } from "../room/useTokens";
import { useY } from "../room/useY";
import { GHOST_SIZE, useScreenDrag } from "../useScreenDrag";
import { useDropToken } from "./dropToken";
import { useTokenDetail } from "./tokenDetailControl";
import { useFocusToken } from "./focusToken";
import { useSelectedTokens } from "./selectedTokens";
import { TokenListBadges } from "./TokenListBadges";
import { useOpenTokenMenu } from "./tokenMenu";
import { startTokenDrag } from "./tokenDrag";
import { rimStyle } from "./tokenRim";
import classes from "./TokenList.module.css";
import { usePointerRaise } from "../usePointerRaise";

const GRIP_WIDTH = 28;

export function TokenList() {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const tokens = useTokens().filter((token) => !fogGuard.hidesSquare(token));
  const images = useY(room.imagesMap);
  const selected = useSelectedTokens();
  const [editingId, setEditingId] = useState<string | null>(null);
  // While a row is dragged, the list follows it here and the room learns the new place on release.
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const ids = tokens.map((token) => token.id);
  const order = dragOrder
    ? [
        ...dragOrder.filter((id) => ids.includes(id)),
        ...ids.filter((id) => !dragOrder.includes(id)),
      ]
    : ids;

  if (tokens.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No tokens yet. Add them with +, or drop images onto the map.
      </Text>
    );
  }

  function drop(id: string) {
    if (!dragOrder) return;
    room.moveToken(id, order[order.indexOf(id) + 1] ?? null);
    setDragOrder(null);
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={order}
      onReorder={setDragOrder}
      style={{ display: "flex", flexDirection: "column", gap: 4 }}
    >
      {order.flatMap((id) => {
        const token = tokens.find((other) => other.id === id);
        return token
          ? [
              <TokenRow
                key={id}
                token={token}
                image={embeddedImage(images[token.imageId])}
                isSelected={selected.includes(id)}
                isEditing={id === editingId}
                onEdit={(isEditing) => setEditingId(isEditing ? id : null)}
                onDrop={() => drop(id)}
              />,
            ]
          : [];
      })}
    </Reorder.Group>
  );
}

interface TokenRowProps {
  token: Token;
  image: string | null;
  isSelected: boolean;
  isEditing: boolean;
  onEdit: (isEditing: boolean) => void;
  onDrop: () => void;
}

function TokenRow({
  token,
  image,
  isSelected,
  isEditing,
  onEdit,
  onDrop,
}: TokenRowProps) {
  const room = useRoom();
  const focusToken = useFocusToken();
  const openTokenMenu = useOpenTokenMenu();
  const dropToken = useDropToken();
  const detail = useTokenDetail();
  const theme = useMantineTheme();
  // Only a mouse raises the image; a finger taps it instead.
  const imageRaise = usePointerRaise(false);
  const isTapOnImage = useRef(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const sortControls = useDragControls();
  const [isSorting, setIsSorting] = useState(false);
  const [isOverGrip, setIsOverGrip] = useState(false);
  // The grip lies inside the row, which the browser would otherwise drag as a copy for the map. The
  // grip keeps its presses from the row, so any press on the row lets go of it.
  const isGripPressed = useRef(false);
  const { handlers, ghostStart, ghostRef, isClickIgnored } = useScreenDrag(
    (samples) => {
      const release = samples.at(-1);
      if (!release) throw new Error("Dropped token without a point");
      dropToken(token.id, release);
    },
    // The detail lies where the token is dragged to.
    () => detail.hide(),
  );
  const avatarFilter = isOutOfFight(token) ? "grayscale(1)" : undefined;
  const rim = rimStyle(theme);

  return (
    <Reorder.Item
      as="div"
      value={token.id}
      dragListener={false}
      dragControls={sortControls}
      onDragStart={() => {
        detail.hide();
        setIsSorting(true);
      }}
      onDragEnd={() => {
        setIsSorting(false);
        onDrop();
      }}
    >
      <Tooltip
        label="Click to find, double-click to rename, drag for a copy"
        position="left"
        // The detail of a hovered image opens where the tooltip would, and the grip only reorders.
        disabled={isEditing || imageRaise.isRaised || isOverGrip || isSorting}
      >
        <Group
          gap="xs"
          wrap="nowrap"
          p={4}
          bdrs="sm"
          bg={
            isSelected
              ? "var(--mantine-color-default-hover)"
              : isSorting
                ? "var(--mantine-color-body)"
                : undefined
          }
          style={{
            cursor: isEditing ? undefined : "pointer",
            // Moving up or down scrolls the list; moving sideways drags the token to the map.
            touchAction: "pan-y",
          }}
          // While editing, dragging selects text in the name instead.
          draggable={!isEditing}
          onDragStart={(event) => {
            if (isGripPressed.current) {
              event.preventDefault();
              return;
            }
            detail.hide();
            startTokenDrag(event.dataTransfer, token.id);
            // The browser would show the square picture inside the round frame, or the whole row.
            const avatar = avatarRef.current;
            if (!avatar) throw new Error("Token image is not mounted");
            event.dataTransfer.setDragImage(
              avatar,
              avatar.offsetWidth / 2,
              avatar.offsetHeight / 2,
            );
          }}
          // The mouse keeps the browser's drag and drop, which also shows where it may drop.
          onPointerDown={(event) => {
            isGripPressed.current = false;
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
          {/* Reaches over the row's padding, so a finger finds it without hitting the image. */}
          <Box
            c="dimmed"
            w={GRIP_WIDTH}
            my={-4}
            ml={-4}
            display="flex"
            style={{
              flexShrink: 0,
              alignSelf: "stretch",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              touchAction: "none",
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              isGripPressed.current = true;
              sortControls.start(event);
            }}
            onPointerEnter={() => setIsOverGrip(true)}
            onPointerLeave={() => setIsOverGrip(false)}
            onClick={(event) => event.stopPropagation()}
            aria-label="Drag to reorder"
          >
            <IconGripVertical size={16} style={{ display: "block" }} />
          </Box>
          <Box
            pos="relative"
            className={classes.image}
            style={{ flexShrink: 0 }}
            // Besides finding the token like the rest of the row, the image shows its detail: with a
            // mouse when it rests on it, with a finger when tapped.
            mod={{ raised: imageRaise.isRaised }}
            onPointerEnter={(event) => {
              imageRaise.handlers.onPointerEnter(event);
              if (event.pointerType === "mouse") detail.hover(token.id);
            }}
            onPointerLeave={(event) => {
              imageRaise.handlers.onPointerLeave();
              if (event.pointerType === "mouse") detail.hover(null);
            }}
            onPointerDown={(event) => {
              isTapOnImage.current = event.pointerType !== "mouse";
            }}
            onClick={() => {
              if (isTapOnImage.current && !isClickIgnored()) {
                detail.toggle(token.id);
              }
            }}
          >
            <Avatar
              ref={avatarRef}
              src={image}
              size="md"
              style={{ ...rim, filter: avatarFilter }}
            />
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
          style={{ ...rim, filter: avatarFilter }}
        />
      </DragGhost>
    </Reorder.Item>
  );
}
