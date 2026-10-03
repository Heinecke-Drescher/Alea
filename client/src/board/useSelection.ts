import type { Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import type { ItemType } from "../room/areaActions";
import type { Room } from "../room/createRoom";
import { CELL_SIZE } from "../room/grid";
import {
  areaSelection,
  boxBetween,
  clipToMap,
  NO_SELECTION,
  selectedArea,
  selectedItems,
  withoutItem,
  withPressedItem,
  type Selection,
} from "./selection";

export type SelectionControls = ReturnType<typeof useSelection>;

export function useSelection(room: Room) {
  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const areaStart = useRef<Vector2d | null>(null);
  const addedOnPress = useRef<string | null>(null);
  const area = selectedArea(selection);
  const items = selectedItems(selection);

  useEffect(() => {
    const clear = () => setSelection(NO_SELECTION);
    room.undoManager.on("stack-item-popped", clear);
    return () => room.undoManager.off("stack-item-popped", clear);
  }, [room]);

  function clear() {
    setSelection(NO_SELECTION);
  }

  function beginArea(point: Vector2d) {
    areaStart.current = point;
    clear();
  }

  function extendArea(point: Vector2d) {
    if (!areaStart.current) return;
    setSelection(
      areaSelection(
        clipToMap(boxBetween(areaStart.current, point), room.mapBounds()),
      ),
    );
  }

  function endArea() {
    areaStart.current = null;
  }

  function moveArea(dx: number, dy: number) {
    if (!area) throw new Error("Moved a selection that does not exist");
    room.moveArea(area, dx, dy);
    setSelection(
      areaSelection({
        ...area,
        x: area.x + dx * CELL_SIZE,
        y: area.y + dy * CELL_SIZE,
      }),
    );
  }

  function pressItem(type: ItemType, id: string, isAdding: boolean) {
    const next = withPressedItem(selection, type, id, isAdding);
    addedOnPress.current = isAdding && next !== selection ? id : null;
    setSelection(next);
  }

  // Removing waits for the click, so Ctrl+drag on a selected item still drags the whole selection.
  function clickItem(type: ItemType, id: string, isAdding: boolean) {
    if (!isAdding || addedOnPress.current === id) return;
    setSelection(withoutItem(selection, type, id));
  }

  return {
    selection,
    area,
    items,
    set: setSelection,
    clear,
    beginArea,
    extendArea,
    endArea,
    moveArea,
    pressItem,
    clickItem,
  };
}
