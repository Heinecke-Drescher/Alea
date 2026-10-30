import { Text } from "@mantine/core";
import {
  IconClipboard,
  IconClipboardCopy,
  IconScissors,
  IconTrash,
} from "@tabler/icons-react";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";
import {
  ContextMenuDivider,
  ContextMenuItem,
  useContextMenu,
} from "mantine-contextmenu";
import { showMenuAt } from "../tokens/showMenuAt";
import type { useClipboard } from "./useClipboard";
import type { SelectionControls } from "./useSelection";

export function shortcut(keys: string) {
  return (
    <Text size="xs" c="dimmed">
      {keys}
    </Text>
  );
}

export function useBoardMenu(
  selection: SelectionControls,
  clipboard: ReturnType<typeof useClipboard>,
) {
  const { showContextMenu } = useContextMenu();

  function open(event: KonvaEventObject<MouseEvent>, point: Vector2d) {
    const hasSelection = selection.selection.kind !== "none";
    showMenuAt(
      showContextMenu,
      (close) => (
        <>
          <ContextMenuItem
            title="Copy"
            icon={<IconClipboardCopy size={16} />}
            iconRight={shortcut("Ctrl+C")}
            disabled={!hasSelection}
            onClick={clipboard.copy}
            onHide={close}
            submenuProps={{}}
          />
          <ContextMenuItem
            title="Cut"
            icon={<IconScissors size={16} />}
            iconRight={shortcut("Ctrl+X")}
            disabled={!hasSelection}
            onClick={clipboard.cut}
            onHide={close}
            submenuProps={{}}
          />
          <ContextMenuItem
            title="Paste here"
            icon={<IconClipboard size={16} />}
            iconRight={shortcut("Ctrl+V")}
            disabled={!clipboard.hasClip()}
            onClick={() => clipboard.pasteAt(point)}
            onHide={close}
            submenuProps={{}}
          />
          <ContextMenuDivider />
          <ContextMenuItem
            title="Delete"
            icon={<IconTrash size={16} />}
            iconRight={shortcut("Del")}
            color="red"
            disabled={!hasSelection}
            onClick={clipboard.remove}
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
