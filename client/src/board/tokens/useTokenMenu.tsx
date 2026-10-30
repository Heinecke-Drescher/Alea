import { useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconClipboardCopy,
  IconCopy,
  IconCursorText,
  IconScissors,
  IconTrash,
} from "@tabler/icons-react";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  ContextMenuDivider,
  ContextMenuItem,
  useContextMenu,
} from "mantine-contextmenu";
import { useFogGuard } from "../../fog/useFogGuard";
import { showRoomSpaceError } from "../../images/showRoomSpaceError";
import type { Room } from "../../room/createRoom";
import { STATUS_EFFECTS, tokenEffects } from "../../room/effects";
import type { Token } from "../../room/roomStore";
import { openRenameDialog } from "../../tokens/openRenameDialog";
import { EFFECT_COLORS, EFFECT_ICONS, EFFECT_LABELS } from "./effectIcons";
import { NO_ITEMS } from "../../room/areaActions";
import { itemsSelection } from "../selection/selection";
import { shortcut } from "../selection/useBoardMenu";
import type { useClipboard } from "../selection/useClipboard";
import { showMenuAt } from "./showMenuAt";
import type { SelectionControls } from "../selection/useSelection";

export function useTokenMenu(
  room: Room,
  selection: SelectionControls,
  clipboard: ReturnType<typeof useClipboard>,
) {
  const { showContextMenu } = useContextMenu();
  const theme = useMantineTheme();
  const fogGuard = useFogGuard();

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
    const only = { ...NO_ITEMS, tokens: [token.id] };
    selection.set(itemsSelection(only));
    const effects = tokenEffects(token);
    showMenuAt(
      showContextMenu,
      (close) => (
        <>
          <ContextMenuItem
            title="Rename…"
            icon={<IconCursorText size={16} />}
            onClick={() => openRenameDialog(room, token.id)}
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
          <ContextMenuDivider />
          {STATUS_EFFECTS.map((effect) => {
            const EffectIcon = EFFECT_ICONS[effect];
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
      ),
      event,
    );
  }

  return { open };
}
