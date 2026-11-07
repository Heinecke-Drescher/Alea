import type { Stage } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { CLICK_DISTANCE } from "../selection/selection";
import type { SelectionControls } from "../selection/useSelection";
import type { BoardTool } from "./tool";

interface FingerPress {
  point: Vector2d;
  stage: Stage;
  view: Vector2d;
}

// A finger on the empty map pans it, so only a tap deselects or picks a painted cell. Konva sends
// no pointer moves while the map is dragged, so a moved map tells that the finger panned.
export function useSelectTool(selection: SelectionControls): BoardTool {
  const finger = useRef<FingerPress | null>(null);

  return {
    selectsItems: true,
    listensToDrawings: true,
    onDown({ point, event }) {
      finger.current = null;
      const stage = event.target.getStage();
      if (event.target !== stage) return;
      if (event.evt.ctrlKey || event.evt.metaKey) return;
      if (event.evt.pointerType === "touch") {
        finger.current = { point, stage, view: stage.position() };
        return;
      }
      selection.beginArea(point, CLICK_DISTANCE);
    },
    onMove({ point }) {
      if (!finger.current) selection.extendArea(point);
    },
    onUp() {
      const press = finger.current;
      finger.current = null;
      if (!press) {
        selection.endArea();
        return;
      }
      const { x, y } = press.stage.position();
      if (x === press.view.x && y === press.view.y) selection.tap(press.point);
    },
    onCancel() {
      finger.current = null;
      selection.cancelArea();
    },
  };
}
