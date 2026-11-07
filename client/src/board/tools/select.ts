import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import { useContextMenu } from "mantine-contextmenu";
import { useRef } from "react";
import { CLICK_DISTANCE, TAP_SCREEN_DISTANCE } from "../selection/selection";
import type { SelectionControls } from "../selection/useSelection";
import type { BoardTool } from "./tool";

interface FingerPress {
  point: Vector2d;
  stage: Stage;
  view: Vector2d;
  // Set once the finger was held still: then it draws an area, or opens the menu when lifted.
  held: KonvaEventObject<PointerEvent> | null;
  isDrawing: boolean;
}

function hasPanned({ stage, view }: FingerPress) {
  const { x, y } = stage.position();
  return x !== view.x || y !== view.y;
}

// A finger on the empty map pans it, so only a tap deselects or picks a painted cell. Konva sends
// no pointer moves while the map is dragged, so a moved map tells that the finger panned.
export function useSelectTool(selection: SelectionControls): BoardTool {
  const finger = useRef<FingerPress | null>(null);
  const { hideContextMenu } = useContextMenu();

  return {
    selectsItems: true,
    listensToDrawings: true,
    onDown({ point, event }) {
      finger.current = null;
      const stage = event.target.getStage();
      if (event.target !== stage) return;
      if (event.evt.ctrlKey || event.evt.metaKey) return;
      if (event.evt.pointerType === "touch") {
        const view = stage.position();
        finger.current = { point, stage, view, held: null, isDrawing: false };
        return;
      }
      selection.beginArea(point, CLICK_DISTANCE);
    },
    onLongPress(event) {
      const press = finger.current;
      if (!press || event.target !== press.stage || hasPanned(press)) {
        return false;
      }
      press.stage.stopDrag();
      press.held = event;
      return true;
    },
    onMove({ point, event }) {
      const press = finger.current;
      if (!press) {
        selection.extendArea(point);
        return;
      }
      if (!press.held) return;
      if (!press.isDrawing) {
        const moved = Math.hypot(
          event.evt.clientX - press.held.evt.clientX,
          event.evt.clientY - press.held.evt.clientY,
        );
        if (moved <= TAP_SCREEN_DISTANCE) return;
        press.isDrawing = true;
        hideContextMenu();
        selection.beginArea(
          press.point,
          TAP_SCREEN_DISTANCE / press.stage.scaleX(),
        );
      }
      selection.extendArea(point);
    },
    onUp() {
      const press = finger.current;
      finger.current = null;
      if (!press) {
        selection.endArea();
        return;
      }
      if (press.isDrawing) {
        selection.endArea();
        return;
      }
      if (press.held) {
        press.held.target.fire("contextmenu", { evt: press.held.evt }, true);
        return;
      }
      if (!hasPanned(press)) selection.tap(press.point);
    },
    onCancel() {
      finger.current = null;
      selection.cancelArea();
    },
  };
}
