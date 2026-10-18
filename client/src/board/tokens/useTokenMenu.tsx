import { useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconCopy,
  IconCursorText,
  IconTrash,
} from "@tabler/icons-react";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  ContextMenuDivider,
  ContextMenuItem,
  useContextMenu,
} from "mantine-contextmenu";
import type { Room } from "../../room/createRoom";
import { STATUS_EFFECTS, tokenEffects } from "../../room/effects";
import type { Token } from "../../room/roomStore";
import { openRenameDialog } from "../../tokens/openRenameDialog";
import { EFFECT_COLORS, EFFECT_ICONS, EFFECT_LABELS } from "./effectIcons";
import { itemsSelection, NO_ITEMS } from "../selection/selection";
import { showMenuAt } from "./showMenuAt";
import type { SelectionControls } from "../selection/useSelection";

export function useTokenMenu(room: Room, selection: SelectionControls) {
  const { showContextMenu } = useContextMenu();
  const theme = useMantineTheme();

  function duplicate(token: Token) {
    const copyId = room.duplicateToken(token.id);
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
    selection.set(itemsSelection({ ...NO_ITEMS, tokens: [token.id] }));
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
            title="Delete"
            icon={<IconTrash size={16} />}
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
