import { notifications } from "@mantine/notifications";
import type { IRect, Vector2d } from "konva/lib/types";
import { useRef, type RefObject } from "react";
import type { Clip } from "../room/areaActions";
import type { Room } from "../room/createRoom";
import { CELL_SIZE, mapRect } from "../room/grid";
import {
  cellOffset,
  linesBounds,
  pixelOffset,
  strokesSelection,
} from "./selection";
import type { SelectionControls } from "./useSelection";

interface Clipboard {
  clip: Clip;
  bounds: IRect;
  snapsToCells: boolean;
}

interface ClipboardOptions {
  room: Room;
  selection: SelectionControls;
  pointer: RefObject<Vector2d | null>;
  onPaste: () => void;
}

export function useClipboard({
  room,
  selection,
  pointer,
  onPaste,
}: ClipboardOptions) {
  const clipboard = useRef<Clipboard | null>(null);
  const { area, strokeIds } = selection;

  function copy() {
    if (area) {
      clipboard.current = {
        clip: room.copyArea(area),
        bounds: area,
        snapsToCells: true,
      };
      return;
    }
    const clip = room.copyStrokes(strokeIds);
    if (clip.strokes.length === 0) return;
    clipboard.current = {
      clip,
      bounds: linesBounds(clip.strokes.map((stroke) => stroke.points)),
      snapsToCells: false,
    };
  }

  function remove() {
    if (area) {
      room.deleteArea(area);
    } else if (strokeIds.length > 0) {
      room.deleteStrokes(strokeIds);
    }
    selection.clear();
  }

  function cut() {
    copy();
    remove();
  }

  function paste() {
    if (!clipboard.current) return;
    const { clip, bounds, snapsToCells } = clipboard.current;
    // Before the mouse has been over the map, paste where the copy came from.
    const target = pointer.current ?? bounds;
    const map = mapRect(room.mapBounds());
    if (
      snapsToCells &&
      (bounds.width > map.width || bounds.height > map.height)
    ) {
      notifications.show({
        color: "red",
        message: "The copied area is larger than the map.",
      });
      return;
    }
    onPaste();
    if (snapsToCells) {
      const { dx, dy } = cellOffset(bounds, target, room.mapBounds());
      room.paste(clip, dx * CELL_SIZE, dy * CELL_SIZE);
      // A frame around the paste would also catch what was there before.
      selection.clear();
    } else {
      const { dx, dy } = pixelOffset(bounds, target, room.mapBounds());
      selection.set(strokesSelection(room.paste(clip, dx, dy)));
    }
  }

  return { copy, cut, paste, remove };
}
