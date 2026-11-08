import { useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconClipboardCopy,
  IconCopy,
  IconCursorText,
  IconFlagPlus,
  IconPhoto,
  IconScissors,
  IconTrash,
} from "@tabler/icons-react";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  ContextMenuDivider,
  ContextMenuItem,
  useContextMenu,
  type ContextMenuContent,
} from "mantine-contextmenu";
import { useRef, type MouseEvent as ReactMouseEvent } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import { createImage, TOKEN_IMAGE_SIZE } from "../../images/createImage";
import { useImageFileDialog } from "../../images/useImageFileDialog";
import { usePlayer } from "../../player/PlayerContext";
import { showRoomSpaceError } from "../../images/showRoomSpaceError";
import type { Room } from "../../room/createRoom";
import { STATUS_EFFECTS, tokenEffects } from "../../room/effects";
import { MAX_MARKS, tokenMarks } from "../../room/marks";
import type { Token } from "../../room/roomStore";
import { TOKEN_FILE_MEGABYTES } from "../../tokens/addTokenFromFile";
import { openMarkDialog } from "../../tokens/openMarkDialog";
import { openPlaceholderImageDialog } from "../../tokens/openPlaceholderImageDialog";
import { openRenameDialog } from "../../tokens/openRenameDialog";
import {
  EFFECT_COLORS,
  EFFECT_LABELS,
  badgeIcon,
  markLabel,
} from "../../tokens/badgeIcons";
import { NO_ITEMS } from "../../room/areaActions";
import { itemsSelection } from "../selection/selection";
import { shortcut } from "../selection/useBoardMenu";
import type { useClipboard } from "../selection/useClipboard";
import { showMenuAt } from "./showMenuAt";
import { TokenSizeControl } from "./TokenSizeControl";
import { CELL_SIZE } from "../../room/grid";
import type { SelectionControls } from "../selection/useSelection";

function onlyToken(token: Token) {
  return { ...NO_ITEMS, tokens: [token.id] };
}

export function useTokenMenu(
  room: Room,
  selection: SelectionControls,
  clipboard: ReturnType<typeof useClipboard>,
) {
  const { showContextMenu } = useContextMenu();
  const theme = useMantineTheme();
  const fogGuard = useFogGuard();
  const player = usePlayer();
  const imageTokenId = useRef<string | null>(null);
  const chooseImage = useImageFileDialog({
    maxMegabytes: TOKEN_FILE_MEGABYTES,
    multiple: false,
    onFile: async (file) => {
      const id = imageTokenId.current;
      // Someone may have removed it while the file dialog was open.
      const token = id === null ? undefined : room.tokensMap.get(id);
      if (!token) return;
      const image = await createImage(file, TOKEN_IMAGE_SIZE);
      room.assertSpaceForImage(image, token.imageId);
      room.setTokenImage(token.id, image);
    },
  });

  function duplicate(token: Token) {
    let copyId: string | undefined;
    try {
      copyId = room.duplicateToken(token.id, fogGuard.blockedSquares());
    } catch (error) {
      showRoomSpaceError(error);
      return;
    }
    if (copyId) {
      selection.set(itemsSelection({ ...NO_ITEMS, tokens: [copyId] }));
    } else if (room.tokensMap.has(token.id)) {
      notifications.show({
        color: "red",
        message: "No free space for a copy.",
      });
    }
  }

  function open(token: Token, event: KonvaEventObject<MouseEvent>) {
    // The board has a menu of its own.
    event.cancelBubble = true;
    selection.set(itemsSelection(onlyToken(token)));
    showMenuAt(showContextMenu, content(token), event);
  }

  function openAt(token: Token, event: ReactMouseEvent) {
    selection.set(itemsSelection(onlyToken(token)));
    showContextMenu(content(token))(event);
  }

  function content(token: Token): ContextMenuContent {
    const only = onlyToken(token);
    const effects = tokenEffects(token);
    const marks = tokenMarks(token);
    return (close) => (
      <>
        <ContextMenuItem
          title="Rename"
          icon={<IconCursorText size={16} />}
          onClick={() => openRenameDialog(room, token.id)}
          onHide={close}
          submenuProps={{}}
        />
        <ContextMenuItem
          title="Change image"
          icon={<IconPhoto size={16} />}
          items={[
            {
              key: "upload",
              title: "Upload image",
              onClick: () => {
                imageTokenId.current = token.id;
                chooseImage();
              },
            },
            {
              key: "placeholder",
              title: "Placeholder",
              onClick: () =>
                openPlaceholderImageDialog(room, token.id, player.color, theme),
            },
          ]}
          onHide={close}
          submenuProps={{}}
        />
        <ContextMenuItem
          title="Duplicate"
          icon={<IconCopy size={16} />}
          // Stays open so several copies take only several clicks. The
          // click must not bubble up to the menu's overlay, which closes it.
          onClick={(event) => {
            event.stopPropagation();
            duplicate(token);
          }}
          onHide={() => {}}
          submenuProps={{}}
        />
        <TokenSizeControl
          room={room}
          tokenId={token.id}
          allows={({ x, y, size }) =>
            !fogGuard.hidesRect({
              x: x * CELL_SIZE,
              y: y * CELL_SIZE,
              width: size * CELL_SIZE,
              height: size * CELL_SIZE,
            })
          }
        />
        <ContextMenuDivider />
        {STATUS_EFFECTS.map((effect) => {
          const EffectIcon = badgeIcon(effect);
          return (
            <ContextMenuItem
              key={effect}
              title={EFFECT_LABELS[effect]}
              icon={
                <EffectIcon
                  size={16}
                  color={theme.colors[EFFECT_COLORS[effect]][8]}
                />
              }
              iconRight={effects.includes(effect) && <IconCheck size={16} />}
              onClick={() => room.toggleEffect(token.id, effect)}
              onHide={close}
              submenuProps={{}}
            />
          );
        })}
        {marks.map((mark, i) => {
          const MarkIcon = badgeIcon(mark.icon);
          return (
            <ContextMenuItem
              key={i}
              title={markLabel(mark)}
              icon={<MarkIcon size={16} color={theme.colors[mark.color][8]} />}
              onClick={() => openMarkDialog(room, token.id, i)}
              onHide={close}
              submenuProps={{}}
            />
          );
        })}
        {marks.length < MAX_MARKS && (
          <ContextMenuItem
            title="Add mark"
            icon={<IconFlagPlus size={16} />}
            onClick={() => openMarkDialog(room, token.id)}
            onHide={close}
            submenuProps={{}}
          />
        )}
        <ContextMenuDivider />
        <ContextMenuItem
          title="Copy"
          icon={<IconClipboardCopy size={16} />}
          iconRight={shortcut("Ctrl+C")}
          onClick={() => clipboard.copyItems(only)}
          onHide={close}
          submenuProps={{}}
        />
        <ContextMenuItem
          title="Cut"
          icon={<IconScissors size={16} />}
          iconRight={shortcut("Ctrl+X")}
          onClick={() => clipboard.cutItems(only)}
          onHide={close}
          submenuProps={{}}
        />
        <ContextMenuItem
          title="Delete"
          icon={<IconTrash size={16} />}
          iconRight={shortcut("Del")}
          color="red"
          onClick={() => {
            room.removeToken(token.id);
            selection.clear();
          }}
          onHide={close}
          submenuProps={{}}
        />
      </>
    );
  }

  return { open, openAt };
}
