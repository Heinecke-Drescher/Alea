import type { Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import type { Room } from "../room/createRoom";
import { CELL_SIZE } from "../room/grid";
import {
  areaSelection,
  boxBetween,
  clipToMap,
  NO_SELECTION,
  selectedArea,
  selectedStrokeIds,
  withoutStroke,
  withPressedStroke,
  type Selection,
} from "./selection";

export type SelectionControls = ReturnType<typeof useSelection>;

export function useSelection(room: Room) {
  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const areaStart = useRef<Vector2d | null>(null);
  const addedOnPress = useRef<string | null>(null);
  const area = selectedArea(selection);
  const strokeIds = selectedStrokeIds(selection);

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

  function pressStroke(id: string, isAdding: boolean) {
    const next = withPressedStroke(selection, id, isAdding);
    addedOnPress.current = isAdding && next !== selection ? id : null;
    setSelection(next);
  }

  // Removing waits for the click, so Ctrl+drag on a selected stroke still drags the whole selection.
  function clickStroke(id: string, isAdding: boolean) {
    if (!isAdding || addedOnPress.current === id) return;
    setSelection(withoutStroke(selection, id));
  }

  return {
    selection,
    area,
    strokeIds,
    set: setSelection,
    clear,
    beginArea,
    extendArea,
    endArea,
    moveArea,
    pressStroke,
    clickStroke,
  };
}
