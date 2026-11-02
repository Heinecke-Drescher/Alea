import type { Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import type { ItemType } from "../../room/areaActions";
import type { Room } from "../../room/createRoom";
import { CELL_SIZE, cellAt } from "../../room/grid";
import { cellKey } from "../../room/roomStore";
import {
  areaSelection,
  boxBetween,
  cellRect,
  clipToMap,
  isClickArea,
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
  const areaStart = useRef<{ point: Vector2d; clickDistance: number } | null>(
    null,
  );
  const addedOnPress = useRef<string | null>(null);
  const fogGuard = useFogGuard();
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

  function beginArea(point: Vector2d, clickDistance: number) {
    areaStart.current = { point, clickDistance };
    clear();
  }

  function extendArea(point: Vector2d) {
    if (!areaStart.current) return;
    const next = clipToMap(
      boxBetween(areaStart.current.point, point),
      room.mapBounds(),
    );
    if (next && fogGuard.hidesRect(next)) return;
    setSelection(areaSelection(next));
  }

  function cancelArea() {
    if (!areaStart.current) return;
    areaStart.current = null;
    clear();
  }

  // A click on a painted cell selects it as a frame around that cell, so moving, copying and
  // deleting work as for any frame.
  function endArea() {
    const start = areaStart.current;
    areaStart.current = null;
    if (!start || !isClickArea(area, start.clickDistance)) return;
    const cell = cellAt(start.point);
    if (!room.cellsMap.has(cellKey(cell.x, cell.y))) return;
    if (fogGuard.hidesCell(cell.x, cell.y)) return;
    setSelection(areaSelection(cellRect(cell)));
  }

  function moveArea(dx: number, dy: number) {
    if (!area) throw new Error("Moved a selection that does not exist");
    const moved = {
      ...area,
      x: area.x + dx * CELL_SIZE,
      y: area.y + dy * CELL_SIZE,
    };
    if (fogGuard.hidesRect(moved)) return;
    room.moveArea(area, dx, dy);
    setSelection(areaSelection(moved));
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
    cancelArea,
    moveArea,
    pressItem,
    clickItem,
  };
}
