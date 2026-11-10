import type { Stage as StageNode } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import type { DragEvent } from "react";

// A point in pixels of the browser window, e.g. where something is dropped or let go.
export function screenPointOnMap(stage: StageNode, { x, y }: Vector2d) {
  const box = stage.container().getBoundingClientRect();
  return stage
    .getAbsoluteTransform()
    .copy()
    .invert()
    .point({ x: x - box.left, y: y - box.top });
}

// Letting go over the toolbar or a button above the map is not on the map.
export function isOverMap(stage: StageNode, { x, y }: Vector2d) {
  const target = document.elementFromPoint(x, y);
  return target !== null && stage.container().contains(target);
}

export function dropPointOnMap(
  stage: StageNode | null,
  event: DragEvent<HTMLElement>,
) {
  if (!stage) throw new Error("Stage is not mounted");
  return screenPointOnMap(stage, { x: event.clientX, y: event.clientY });
}
