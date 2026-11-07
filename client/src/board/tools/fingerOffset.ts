import type { Vector2d } from "konva/lib/types";
import { TAP_SCREEN_DISTANCE } from "../selection/selection";
import type { ToolPointer } from "./tool";

// A finger hides what lies under it, so the end of a ruler or shape it drags sits this many
// screen pixels above it.
const FINGER_OFFSET = 60;

// Until the finger moves further than a tap, the end stays under it, so a tap creates nothing.
export function endAboveFinger(
  point: Vector2d,
  press: Vector2d,
  scale: number,
): Vector2d {
  const moved = Math.hypot(point.x - press.x, point.y - press.y) * scale;
  if (moved < TAP_SCREEN_DISTANCE) return point;
  return { x: point.x, y: point.y - FINGER_OFFSET / scale };
}

// Mouse and pen keep the end under them; a wheel event has no pointer type.
export function draggedEnd(
  { point, event }: ToolPointer,
  press: Vector2d,
): Vector2d {
  const isFinger =
    "pointerType" in event.evt && event.evt.pointerType === "touch";
  if (!isFinger) return point;
  const stage = event.target.getStage();
  if (!stage) throw new Error("Pointer event without stage");
  return endAboveFinger(point, press, stage.scaleY());
}
