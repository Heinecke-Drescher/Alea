import type { Stage } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { TAP_SCREEN_DISTANCE } from "../selection/selection";
import type { BoardTool } from "./tool";

interface Press {
  point: Vector2d;
  screen: Vector2d;
  stage: Stage | null;
  view: Vector2d | undefined;
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
      press.current = {
        point,
        screen: { x: event.evt.clientX, y: event.evt.clientY },
        stage,
        view: stage?.position(),
        hasMoved: false,
      };
    },
    onMove({ point, event }) {
      onAim(point);
      const current = press.current;
      if (!current) return;
      const moved = Math.hypot(
        event.evt.clientX - current.screen.x,
        event.evt.clientY - current.screen.y,
      );
      if (moved > TAP_SCREEN_DISTANCE) current.hasMoved = true;
    },
    onUp() {
      const current = press.current;
      press.current = null;
      if (!current || current.hasMoved) return;
      const view = current.stage?.position();
      const hasPanned =
        view?.x !== current.view?.x || view?.y !== current.view?.y;
      if (!hasPanned) onPlace(current.point);
    },
    onCancel() {
      press.current = null;
    },
  };
}
