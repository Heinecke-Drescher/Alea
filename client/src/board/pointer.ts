import type { KonvaEventObject } from "konva/lib/Node";
import { screenPointOnMap } from "./dropPoint";

// Also what touch and pen report, so a finger acts like the left mouse button.
export const PRIMARY_BUTTON = 0;
// The same button in PointerEvent.buttons, which is a bit mask.
export const PRIMARY_BUTTON_FLAG = 1;

export function pointerOnMap(event: KonvaEventObject<MouseEvent>) {
  const pointer = event.target.getStage()?.getRelativePointerPosition();
  if (!pointer) throw new Error("Pointer event without stage pointer");
  return pointer;
}

// A finger or pen is measured more often than the screen draws, and the browser hands the points
// in between along with the last one, so fast strokes follow the hand instead of cutting corners.
export function pointsOnMap(event: KonvaEventObject<PointerEvent>) {
  const stage = event.target.getStage();
  if (!stage) throw new Error("Pointer event without stage");
  // Missing in some browsers, e.g. on some iPhones.
  const moves =
    typeof event.evt.getCoalescedEvents === "function"
      ? event.evt.getCoalescedEvents()
      : [];
  if (moves.length === 0) return [pointerOnMap(event)];
  return moves.map(({ clientX, clientY }) =>
    screenPointOnMap(stage, { x: clientX, y: clientY }),
  );
}
