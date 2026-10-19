import { clamp } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import { useEffect, type RefObject } from "react";
import type { Room } from "../room/createRoom";
import { clampToMap } from "../room/grid";
import { LEFT_MOUSE_BUTTON } from "./mouse";

const MAP_START_X = 72;
const ZOOM_STEP = 1.1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export interface View {
  scale: number;
  x: number;
  y: number;
}

// Keeps the point of the map under the pointer where it is.
export function zoomedView(
  view: View,
  pointer: Vector2d,
  zoomIn: boolean,
): View {
  const pointOnMap = {
    x: (pointer.x - view.x) / view.scale,
    y: (pointer.y - view.y) / view.scale,
  };
  const scale = clamp(
    zoomIn ? view.scale * ZOOM_STEP : view.scale / ZOOM_STEP,
    MIN_ZOOM,
    MAX_ZOOM,
  );
  return {
    scale,
    x: pointer.x - pointOnMap.x * scale,
    y: pointer.y - pointOnMap.y * scale,
  };
}

export function useBoardView(
  room: Room,
  stageRef: RefObject<StageNode | null>,
) {
  function mountedStage() {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    return stage;
  }

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    stage.x(MAP_START_X);
  }, [stageRef]);

  function zoomAtPointer(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    if (event.evt.deltaY === 0) return;
    const stage = mountedStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) throw new Error("Wheel event without stage pointer");
    const { scale, x, y } = zoomedView(
      { scale: stage.scaleX(), x: stage.x(), y: stage.y() },
      pointer,
      event.evt.deltaY < 0,
    );
    stage.scale({ x: scale, y: scale });
    stage.position({ x, y });
  }

  function panOnlyWithMiddleButton(event: KonvaEventObject<DragEvent>) {
    const stage = event.target;
    if (stage !== stageRef.current) return;
    if (event.evt.button === LEFT_MOUSE_BUTTON) stage.stopDrag();
  }

  function viewCenter() {
    const stage = mountedStage();
    const center = stage
      .getAbsoluteTransform()
      .copy()
      .invert()
      .point({ x: stage.width() / 2, y: stage.height() / 2 });
    return clampToMap(center, room.mapBounds());
  }

  return { zoomAtPointer, panOnlyWithMiddleButton, viewCenter };
}
