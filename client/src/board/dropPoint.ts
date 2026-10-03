import type { Stage as StageNode } from "konva/lib/Stage";
import type { DragEvent } from "react";

export function dropPointOnMap(
  stage: StageNode | null,
  event: DragEvent<HTMLElement>,
) {
  if (!stage) throw new Error("Stage is not mounted");
  stage.setPointersPositions(event.nativeEvent);
  const point = stage.getRelativePointerPosition();
  if (!point) throw new Error("Drag without stage pointer");
  return point;
}
