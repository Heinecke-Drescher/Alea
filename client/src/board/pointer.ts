import type { KonvaEventObject } from "konva/lib/Node";
import { screenPointOnMap } from "./dropPoint";

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
