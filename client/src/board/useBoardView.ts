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
// WheelEvent.deltaMode values; Firefox reports a mouse wheel in lines.
const DELTA_LINE = 1;
const DELTA_PAGE = 2;
const LINE_HEIGHT = 16;
// A pinch sends many small steps, a mouse wheel notch one large one; no event zooms more than one ZOOM_STEP.
const PIXELS_PER_ZOOM_STEP = 10;

export interface View {
  scale: number;
  x: number;
  y: number;
}

// Keeps the point of the map under the pointer where it is.
export function zoomedView(
  view: View,
  pointer: Vector2d,
  deltaY: number,
): View {
  const pointOnMap = {
    x: (pointer.x - view.x) / view.scale,
    y: (pointer.y - view.y) / view.scale,
  };
  const scale = clamp(
    view.scale * ZOOM_STEP ** clamp(-deltaY / PIXELS_PER_ZOOM_STEP, -1, 1),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  return {
    scale,
    x: pointer.x - pointOnMap.x * scale,
    y: pointer.y - pointOnMap.y * scale,
  };
}

export function wheelPixels(
  {
    deltaX,
    deltaY,
    deltaMode,
  }: Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode">,
  page: { width: number; height: number },
): Vector2d {
  if (deltaMode === DELTA_PAGE) {
    return { x: deltaX * page.width, y: deltaY * page.height };
  }
  const unit = deltaMode === DELTA_LINE ? LINE_HEIGHT : 1;
  return { x: deltaX * unit, y: deltaY * unit };
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

  // Like drawing tools: the wheel or two fingers pan, Ctrl + wheel zooms.
  // Pinching a trackpad arrives as a wheel event with Ctrl.
  function panOrZoom(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const stage = mountedStage();
    const delta = wheelPixels(event.evt, stage.size());
    if (!event.evt.ctrlKey && !event.evt.metaKey) {
      stage.position({ x: stage.x() - delta.x, y: stage.y() - delta.y });
      return;
    }
    if (delta.y === 0) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) throw new Error("Wheel event without stage pointer");
    const { scale, x, y } = zoomedView(
      { scale: stage.scaleX(), x: stage.x(), y: stage.y() },
      pointer,
      delta.y,
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

  return { panOrZoom, panOnlyWithMiddleButton, viewCenter };
}
