import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import type { ItemType } from "../room/areaActions";
import {
  pointerOnMap,
  pointsOnMap,
  PRIMARY_BUTTON,
  PRIMARY_BUTTON_FLAG,
} from "./pointer";
import { selectedItems, type Selection } from "./selection/selection";
import type { SelectionControls } from "./selection/useSelection";
import type { BoardTool } from "./tools/tool";
import type { useCursorBroadcast } from "./useCursorBroadcast";
import { useLongPress } from "./useLongPress";

function isAddKeyPressed(event: KonvaEventObject<MouseEvent>) {
  return event.evt.ctrlKey || event.evt.metaKey;
}

interface BoardInputOptions {
  activeTool: BoardTool;
  isSelecting: boolean;
  selection: SelectionControls;
  cursor: ReturnType<typeof useCursorBroadcast>;
  pinch: () => void;
  endPinch: () => void;
}

// Decides which pointer and which fingers count, and passes their presses to the active tool or
// the view.
export function useBoardInput({
  activeTool,
  isSelecting,
  selection,
  cursor,
  pinch,
  endPinch,
}: BoardInputOptions) {
  const lastPointer = useRef<Vector2d | null>(null);
  // The pointer that started the tool, so other fingers and a second end event change nothing.
  const toolPointer = useRef<{ id: number; type: string } | null>(null);
  // Items under the first finger select themselves before a second finger makes it a pinch.
  const selectionBeforePress = useRef<Selection | null>(null);
  // Once two fingers touched, fingers do nothing until all are lifted (like Krita), as a finger
  // lifted or briefly lost during a pinch would otherwise select, drag or draw.
  const [areFingersLocked, setFingersLocked] = useState(false);
  const longPress = useLongPress(openPressMenu);

  // On the window, as the last finger may have started on something else than the map.
  useEffect(() => {
    function unlockWhenAllLifted(event: TouchEvent) {
      if (event.touches.length === 0) setFingersLocked(false);
    }
    window.addEventListener("touchend", unlockWhenAllLifted);
    window.addEventListener("touchcancel", unlockWhenAllLifted);
    return () => {
      window.removeEventListener("touchend", unlockWhenAllLifted);
      window.removeEventListener("touchcancel", unlockWhenAllLifted);
    };
  }, []);

  function isSelectClick(event: KonvaEventObject<PointerEvent>) {
    return (
      isSelecting &&
      event.evt.button === PRIMARY_BUTTON &&
      event.evt.isPrimary &&
      !isLockedFinger(event)
    );
  }

  function pressItem(type: ItemType) {
    return (id: string, event: KonvaEventObject<PointerEvent>) => {
      if (isSelectClick(event)) {
        selection.pressItem(type, id, isAddKeyPressed(event));
      }
    };
  }

  function clickItem(type: ItemType) {
    return (id: string, event: KonvaEventObject<PointerEvent>) => {
      if (isSelectClick(event)) {
        selection.clickItem(type, id, isAddKeyPressed(event));
      }
    };
  }

  function isOtherPointer(event: KonvaEventObject<PointerEvent>) {
    return (
      toolPointer.current !== null &&
      event.evt.pointerId !== toolPointer.current.id
    );
  }

  function isLockedFinger(event: KonvaEventObject<PointerEvent>) {
    return areFingersLocked && event.evt.pointerType === "touch";
  }

  function handlePointerDown(event: KonvaEventObject<PointerEvent>) {
    if (!event.evt.isPrimary) longPress.cancel();
    if (isLockedFinger(event)) return;
    if (event.evt.button !== PRIMARY_BUTTON || !event.evt.isPrimary) return;
    // Each kind of pointer has its own primary one, e.g. a hand resting while a pen draws.
    const { pointerId: id, pointerType: type } = event.evt;
    const current = toolPointer.current;
    if (current && current.type !== type) {
      // A pen takes over from a hand that touched first; the other way round the hand is ignored.
      if (type !== "pen") return;
      cancelTool();
    }
    toolPointer.current = { id, type };
    // Still the selection from before this press: items change it only for the next render.
    selectionBeforePress.current = selection.selection;
    activeTool.onDown({ point: pointerOnMap(event), event });
    if (isSelecting) longPress.begin(event);
  }

  function handlePointerMove(event: KonvaEventObject<PointerEvent>) {
    if (isOtherPointer(event) || isLockedFinger(event)) return;
    // Releasing the left button while another one is still pressed sends no pointerup.
    const isReleased = !(event.evt.buttons & PRIMARY_BUTTON_FLAG);
    if (toolPointer.current !== null && isReleased) endTool();
    longPress.move(event);
    moveTo(event, pointsOnMap(event));
  }

  function followPointer(event: KonvaEventObject<MouseEvent>) {
    moveTo(event, [pointerOnMap(event)]);
  }

  function moveTo(event: KonvaEventObject<MouseEvent>, points: Vector2d[]) {
    const last = points.at(-1);
    if (!last) throw new Error("Pointer move without a point");
    lastPointer.current = last;
    cursor.move(last);
    for (const point of points) activeTool.onMove({ point, event });
  }

  // Also gets the pointerup that Konva sends after each pointercancel.
  function handlePointerUp(event: KonvaEventObject<PointerEvent>) {
    if (event.evt.pointerId === toolPointer.current?.id) endTool();
  }

  function handlePointerLeave(event: KonvaEventObject<PointerEvent>) {
    if (isOtherPointer(event)) return;
    cursor.leave();
    if (toolPointer.current !== null) endTool();
  }

  function endTool() {
    longPress.cancel();
    toolPointer.current = null;
    selectionBeforePress.current = null;
    activeTool.onUp();
  }

  // A hand resting while a pen or mouse draws neither stops it nor moves the view.
  function isHandResting() {
    const drawingType = toolPointer.current?.type;
    return drawingType !== undefined && drawingType !== "touch";
  }

  // A second finger turns the touch into moving the view, so the tool stops without a trace.
  // Already when it lands: Konva sends no moves while the first finger drags an item.
  function handleTouchStart(event: KonvaEventObject<TouchEvent>) {
    if (event.evt.touches.length < 2 || isHandResting()) return;
    lockFingers();
    pinch();
  }

  // Read from the touches, as a second finger may land outside the map, e.g. on its buttons.
  function handleTouchMove(event: KonvaEventObject<TouchEvent>) {
    if (isHandResting()) return;
    if (event.evt.touches.length > 1) lockFingers();
    if (event.evt.touches.length === 2) pinch();
    else endPinch();
  }

  function lockFingers() {
    setFingersLocked(true);
    cancelTool();
  }

  function dropTool() {
    longPress.cancel();
    toolPointer.current = null;
    selectionBeforePress.current = null;
    activeTool.onCancel();
  }

  // Also takes back what the press did to the selection.
  function cancelTool() {
    const before = selectionBeforePress.current;
    if (toolPointer.current === null || !before) return;
    dropTool();
    selection.set(before);
  }

  // Chrome sends its own context menu on a long press, while for a finger only the own long press
  // counts, as it may draw an area instead. A menu also ends a press still in progress, so it never
  // opens over a half-drawn area.
  function acceptsMenu(event: KonvaEventObject<MouseEvent>) {
    const isFinger =
      ("pointerType" in event.evt && event.evt.pointerType === "touch") ||
      toolPointer.current?.type === "touch";
    if (event.evt.type === "contextmenu" && isFinger) {
      event.evt.preventDefault();
      return false;
    }
    if (toolPointer.current !== null) dropTool();
    return true;
  }

  // Strokes often cover much of the map, so a finger on one it had not selected pans instead.
  function pansInsteadOfDragging(
    event: KonvaEventObject<DragEvent>,
    isStroke: boolean,
  ) {
    const before = selectionBeforePress.current;
    if (!isStroke || toolPointer.current?.type !== "touch" || !before) {
      return false;
    }
    const node = event.target;
    if (selectedItems(before).strokes.includes(node.id())) return false;
    const stage = node.getStage();
    if (!stage) throw new Error("Dragged stroke is not on a stage");
    node.stopDrag();
    selection.set(before);
    stage.startDrag(event);
    return true;
  }

  // Goes through the right click's handlers, so the press keeps the item it selected for the menu.
  // A dragged item keeps moving instead, as Konva sends no pointer moves to cancel the press then.
  function openPressMenu(event: KonvaEventObject<PointerEvent>) {
    if (Konva.isDragging()) return;
    if (activeTool.onLongPress?.(event)) return;
    dropTool();
    event.target.fire("contextmenu", { evt: event.evt }, true);
  }

  return {
    stageHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: endPinch,
      onTouchCancel: endPinch,
    },
    lastPointer,
    canDragItems: !areFingersLocked,
    followPointer,
    endTool,
    dropTool,
    isLockedFinger,
    pressItem,
    clickItem,
    pansInsteadOfDragging,
    acceptsMenu,
  };
}
