import type { KonvaEventObject } from "konva/lib/Node";
import type {
  ContextMenuContent,
  ShowContextMenuFunction,
} from "mantine-contextmenu";
import type { MouseEvent as ReactMouseEvent } from "react";

export function showMenuAt(
  showContextMenu: ShowContextMenuFunction,
  content: ContextMenuContent,
  event: KonvaEventObject<MouseEvent>,
) {
  // Konva passes the native event, and the menu only reads preventDefault,
  // stopPropagation and the client position from it.
  showContextMenu(content)(event.evt as unknown as ReactMouseEvent);
}
