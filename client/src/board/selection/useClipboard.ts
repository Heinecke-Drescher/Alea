import { notifications } from "@mantine/notifications";
import type { IRect, Vector2d } from "konva/lib/types";
import { useRef, type RefObject } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import { showRoomSpaceError } from "../../images/showRoomSpaceError";
import { usePlayer } from "../../player/PlayerContext";
import { hasGridContent, type Clip, type Items } from "../../room/areaActions";
import type { Room } from "../../room/createRoom";
import { hasShapes } from "../../room/drawing";
import { CELL_SIZE, mapRect, type MapBounds } from "../../room/grid";
import {
  cellOffset,
  clipBounds,
  itemsSelection,
  pixelOffset,
  roundToCells,
} from "./selection";
import type { SelectionControls } from "./useSelection";

function inPixels({ dx, dy }: { dx: number; dy: number }) {
  return { dx: dx * CELL_SIZE, dy: dy * CELL_SIZE };
}

function strokesOffset(
  clip: Clip,
  bounds: IRect,
  target: Vector2d,
  map: MapBounds,
) {
  const offset = pixelOffset(bounds, target, map);
  return hasShapes(clip.strokes) ? roundToCells(offset) : offset;
}

interface Clipboard {
  clip: Clip;
  bounds: IRect;
  isArea: boolean;
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
  const fogGuard = useFogGuard();
  const { isDm } = usePlayer();
  const { area, items } = selection;

  function copyItems(chosen: Items) {
    const clip = room.copyItems(chosen);
    if (!hasGridContent(clip) && clip.strokes.length === 0) return;
    clipboard.current = { clip, bounds: clipBounds(clip), isArea: false };
  }

  function copy() {
    if (area) {
      clipboard.current = {
        clip: room.copyArea(area),
        bounds: area,
        isArea: true,
      };
      return;
    }
    copyItems(items);
  }

  function removeItems(chosen: Items) {
    room.deleteItems(chosen);
    selection.clear();
  }

  function remove() {
    if (area) {
      room.deleteArea(area);
      selection.clear();
    } else {
      removeItems(items);
    }
  }

  function cut() {
    copy();
    remove();
  }

  function cutItems(chosen: Items) {
    copyItems(chosen);
    removeItems(chosen);
  }

  function pasteAt(at: Vector2d | null) {
    if (!clipboard.current) return;
    const { clip, bounds, isArea } = clipboard.current;
    const snapsToCells = isArea || hasGridContent(clip);
    // Before the mouse has been over the map, paste where the copy came from.
    const target = at ?? bounds;
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
    const { dx, dy } = snapsToCells
      ? inPixels(cellOffset(bounds, target, room.mapBounds()))
      : strokesOffset(clip, bounds, target, room.mapBounds());
    // Players' pasted strokes land above the fog, so only cells and tokens are kept out of it.
    const destination = { ...bounds, x: bounds.x + dx, y: bounds.y + dy };
    if (hasGridContent(clip) && fogGuard.hidesRect(destination)) return;
    onPaste();
    let pasted: Items;
    try {
      pasted = room.paste(clip, dx, dy, !isDm);
    } catch (error) {
      showRoomSpaceError(error);
      return;
    }
    // A frame around the paste would also catch what was there before.
    if (isArea) {
      selection.clear();
    } else {
      selection.set(itemsSelection(pasted));
    }
  }

  return {
    copy,
    cut,
    paste: () => pasteAt(pointer.current),
    pasteAt,
    remove,
    copyItems,
    cutItems,
    hasClip: () => clipboard.current !== null,
  };
}
