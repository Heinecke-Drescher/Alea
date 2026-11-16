import type { Stage } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { isBeyondTap } from "../../tap";
import { hasPanned } from "./select";
import type { BoardTool } from "./tool";

interface Press {
  point: Vector2d;
  screen: Vector2d;
  stage: Stage;
  view: Vector2d;
  hasMoved: boolean;
}

// Holds new tokens until a click or tap puts them down. A press that moves or pans the map puts
// nothing down, so the view can still be moved while holding them.
export function usePlaceTool(
  onPlace: (point: Vector2d) => void,
  onAim: (point: Vector2d) => void,
): BoardTool {
  const press = useRef<Press | null>(null);

  return {
    selectsItems: false,
    listensToDrawings: false,
    onDown({ point, event }) {
      const stage = event.target.getStage();
      if (!stage) throw new Error("Pressed outside a stage");
      press.current = {
        point,
        screen: { x: event.evt.clientX, y: event.evt.clientY },
        stage,
        view: stage.position(),
        hasMoved: false,
      };
    },
    onMove({ point, event }) {
      onAim(point);
      const current = press.current;
      if (!current) return;
      const to = { x: event.evt.clientX, y: event.evt.clientY };
      if (isBeyondTap(current.screen, to)) current.hasMoved = true;
    },
    onUp() {
      const current = press.current;
      press.current = null;
      if (!current || current.hasMoved) return;
      if (!hasPanned(current)) onPlace(current.point);
    },
    onCancel() {
      press.current = null;
    },
  };
}
