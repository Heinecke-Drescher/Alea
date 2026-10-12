import { notifications } from "@mantine/notifications";
import { IconCopy, IconCursorText, IconTrash } from "@tabler/icons-react";
import type { KonvaEventObject } from "konva/lib/Node";
import { ContextMenuItem, useContextMenu } from "mantine-contextmenu";
import type { Room } from "../room/createRoom";
import type { Token } from "../room/roomStore";
import { openRenameDialog } from "../tokens/openRenameDialog";
import { itemsSelection, NO_ITEMS } from "./selection";
import { showMenuAt } from "./showMenuAt";
import type { SelectionControls } from "./useSelection";

export function useTokenMenu(room: Room, selection: SelectionControls) {
  const { showContextMenu } = useContextMenu();

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
