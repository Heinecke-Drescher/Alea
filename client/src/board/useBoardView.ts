import { clamp, useReducedMotion } from "@mantine/hooks";
import Konva from "konva";
import type { KonvaEventObject, Node } from "konva/lib/Node";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { IRect, Vector2d } from "konva/lib/types";
import { useEffect, useRef, type RefObject } from "react";
import type { Room } from "../room/createRoom";
import { clampToMap, mapRect } from "../room/grid";
import { dragVelocity, SWING_WINDOW_MS, type DragSample } from "./dragVelocity";
import { PRIMARY_BUTTON } from "./pointer";
import { TOOLBAR_SPACE } from "./Toolbar";

// Keeps the fitted map clear of the toolbar and the fit button; the same on every side, so the map stays centered.
export const VIEW_MARGIN = 72;
const ZOOM_STEP = 1.1;
// Larger than a wheel notch, so each click shows a clear change.
const BUTTON_ZOOM_STEP = 1.25;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
// WheelEvent.deltaMode values; Firefox reports a mouse wheel in lines.
const DELTA_LINE = 1;
const DELTA_PAGE = 2;
const LINE_HEIGHT = 16;
// A pinch sends many small steps, a mouse wheel notch one large one; no event zooms more than one ZOOM_STEP.
const PIXELS_PER_ZOOM_STEP = 10;
// A map flung by a finger slows down exponentially, so every glide takes about as long; the time
// constant follows Ariya Hidayat's "JavaScript Kinetic Scrolling".
const GLIDE_SECONDS = 0.325;
// In pixels per second: slower releases stop where the finger let go.
const MIN_GLIDE_SPEED = 300;
const GLIDE_END_DISTANCE = 0.5;

export interface View {
  scale: number;
  x: number;
  y: number;
}

interface Pinch {
  center: Vector2d;
  distance: number;
}

// The point of the map that was at `from` on the screen ends up at `to`.
function movedView(
  view: View,
  from: Vector2d,
  to: Vector2d,
  scale: number,
): View {
  const pointOnMap = {
    x: (from.x - view.x) / view.scale,
    y: (from.y - view.y) / view.scale,
  };
  return {
    scale,
    x: to.x - pointOnMap.x * scale,
    y: to.y - pointOnMap.y * scale,
  };
}

// Keeps the point of the map under the pointer where it is.
export function zoomedView(
  view: View,
  pointer: Vector2d,
  deltaY: number,
): View {
  const scale = clamp(
    view.scale * ZOOM_STEP ** clamp(-deltaY / PIXELS_PER_ZOOM_STEP, -1, 1),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  return movedView(view, pointer, pointer, scale);
}

// Keeps the point of the map between two fingers between them while they move and spread.
export function pinchedView(view: View, from: Pinch, to: Pinch): View {
  if (from.distance === 0) return view;
  const scale = clamp(
    (view.scale * to.distance) / from.distance,
    MIN_ZOOM,
    MAX_ZOOM,
  );
  return movedView(view, from.center, to.center, scale);
}

function pinchOf(stage: StageNode): Pinch | null {
  const fingers = stage.getPointersPositions();
  const [a, b] = fingers;
  if (fingers.length !== 2 || !a || !b) return null;
  return {
    center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    distance: Math.hypot(b.x - a.x, b.y - a.y),
  };
}

// How far panels over the right and the bottom edge of the stage reach in, which the map keeps clear of.
export interface CoveredEdges {
  right: number;
  bottom: number;
}

export function fittedView(
  map: IRect,
  stage: { width: number; height: number },
  covered: CoveredEdges,
): View {
  const left = VIEW_MARGIN;
  const right = stage.width - Math.max(VIEW_MARGIN, covered.right);
  const top = VIEW_MARGIN;
  const bottom = stage.height - Math.max(VIEW_MARGIN, covered.bottom);
  const scale = clamp(
    Math.min((right - left) / map.width, (bottom - top) / map.height),
    MIN_ZOOM,
    MAX_ZOOM,
  );
  return {
    scale,
    x: (left + right) / 2 - (map.x + map.width / 2) * scale,
    y: (top + bottom) / 2 - (map.y + map.height / 2) * scale,
  };
}

// How far left of the stage's middle a fitted map's middle lies, so what floats over the map shares its axis.
export function fittedAxisShift(covered: CoveredEdges) {
  return (Math.max(VIEW_MARGIN, covered.right) - VIEW_MARGIN) / 2;
}

export function centeredView(
  scale: number,
  point: Vector2d,
  area: IRect,
): View {
  return {
    scale,
    x: area.x + area.width / 2 - point.x * scale,
    y: area.y + area.height / 2 - point.y * scale,
  };
}

export function glideVelocity(
  velocity: Vector2d,
  maxDistance: number,
): Vector2d | null {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < MIN_GLIDE_SPEED) return null;
  const factor = Math.min(1, maxDistance / (speed * GLIDE_SECONDS));
  return { x: velocity.x * factor, y: velocity.y * factor };
}

export function glideOffset(velocity: Vector2d, seconds: number) {
  const reach = 1 - Math.exp(-seconds / GLIDE_SECONDS);
  const remaining =
    Math.hypot(velocity.x, velocity.y) * GLIDE_SECONDS * (1 - reach);
  return {
    x: velocity.x * GLIDE_SECONDS * reach,
    y: velocity.y * GLIDE_SECONDS * reach,
    isDone: remaining < GLIDE_END_DISTANCE,
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
  covered: CoveredEdges,
) {
  const lastPinch = useRef<Pinch | null>(null);
  // Null unless a finger pans the map.
  const panSamples = useRef<DragSample[] | null>(null);
  const glideFrame = useRef<number | null>(null);
  const reducesMotion = useReducedMotion(undefined, {
    getInitialValueInEffect: false,
  });

  useEffect(
    () => () => {
      if (glideFrame.current !== null) cancelAnimationFrame(glideFrame.current);
    },
    [],
  );

  function mountedStage() {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    return stage;
  }

  // Tells whether the map was gliding, so the touch that catches it does nothing else.
  function stopGlide() {
    if (glideFrame.current === null) return false;
    cancelAnimationFrame(glideFrame.current);
    glideFrame.current = null;
    return true;
  }

  function panSample(stage: StageNode): DragSample {
    return { ...stage.position(), time: performance.now() };
  }

  function trackPan(event: KonvaEventObject<DragEvent>) {
    const samples = panSamples.current;
    if (event.target !== stageRef.current || !samples) return;
    const sample = panSample(mountedStage());
    panSamples.current = [
      ...samples.filter(({ time }) => time >= sample.time - SWING_WINDOW_MS),
      sample,
    ];
  }

  function endPan(event: KonvaEventObject<DragEvent>) {
    const samples = panSamples.current;
    if (event.target !== stageRef.current || !samples) return;
    panSamples.current = null;
    if (reducesMotion) return;
    const stage = mountedStage();
    // The release counts as the last move, so a finger held still before lifting has no swing.
    const velocity = glideVelocity(
      dragVelocity([...samples, panSample(stage)]),
      Math.max(stage.width(), stage.height()),
    );
    if (velocity) glide(stage, velocity);
  }

  function glide(stage: StageNode, velocity: Vector2d) {
    const start = stage.position();
    const startTime = performance.now();
    function step(time: number) {
      // A frame's time can lie just before the glide started.
      const { x, y, isDone } = glideOffset(
        velocity,
        Math.max(0, time - startTime) / 1000,
      );
      stage.position({ x: start.x + x, y: start.y + y });
      glideFrame.current = isDone ? null : requestAnimationFrame(step);
    }
    glideFrame.current = requestAnimationFrame(step);
  }

  // Like drawing tools: the wheel or two fingers pan, Ctrl + wheel zooms.
  // Pinching a trackpad arrives as a wheel event with Ctrl.
  function panOrZoom(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    stopGlide();
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

  // The left button and the pen keep the tool's own meaning; a finger pans only where the tool lets it.
  function panWhereAllowed(
    event: KonvaEventObject<DragEvent>,
    fingerPans: boolean,
  ) {
    const stage = event.target;
    if (stage !== stageRef.current) return;
    // Konva starts a finger's drag from a touch event, which has no button.
    const isFinger = event.evt.type.startsWith("touch");
    const allowed = isFinger ? fingerPans : event.evt.button !== PRIMARY_BUTTON;
    // Cleared before stopping, as stopping ends the drag at once.
    panSamples.current = null;
    if (!allowed) {
      stage.stopDrag();
      return;
    }
    if (isFinger) panSamples.current = [panSample(stage)];
  }

  function pointAtStageCenter(stage: StageNode) {
    return stage
      .getAbsoluteTransform()
      .copy()
      .invert()
      .point({ x: stage.width() / 2, y: stage.height() / 2 });
  }

  function viewCenter() {
    return clampToMap(pointAtStageCenter(mountedStage()), room.mapBounds());
  }

  function zoomAroundCenter(factor: number) {
    stopGlide();
    const stage = mountedStage();
    const scale = clamp(stage.scaleX() * factor, MIN_ZOOM, MAX_ZOOM);
    const { x, y } = centeredView(scale, pointAtStageCenter(stage), {
      x: 0,
      y: 0,
      ...stage.size(),
    });
    stage.scale({ x: scale, y: scale });
    stage.position({ x, y });
  }

  function zoomIn() {
    zoomAroundCenter(BUTTON_ZOOM_STEP);
  }

  function zoomOut() {
    zoomAroundCenter(1 / BUTTON_ZOOM_STEP);
  }

  function fitMap() {
    stopGlide();
    const stage = mountedStage();
    const { scale, x, y } = fittedView(
      mapRect(room.mapBounds()),
      stage.size(),
      covered,
    );
    stage.scale({ x: scale, y: scale });
    stage.position({ x, y });
  }

  // In the middle of what the toolbar and a panel over the bottom edge leave free, on the toolbar's axis.
  function centerOn(point: Vector2d) {
    stopGlide();
    const stage = mountedStage();
    const visible = {
      x: 0,
      y: TOOLBAR_SPACE,
      width: stage.width() - 2 * fittedAxisShift(covered),
      height: stage.height() - TOOLBAR_SPACE - covered.bottom,
    };
    const { x, y } = centeredView(stage.scaleX(), point, visible);
    stage.position({ x, y });
  }

  // Two fingers move and zoom the view; a token dragged by one of them is dropped where it got to.
  function pinch() {
    const stage = mountedStage();
    const next = pinchOf(stage);
    if (!next) {
      lastPinch.current = null;
      return;
    }
    // Two fingers move the view themselves; the pan of the first one does not glide on.
    stopGlide();
    panSamples.current = null;
    if (Konva.isDragging()) {
      for (const node of stage.find((node: Node) => node.isDragging())) {
        node.stopDrag();
      }
      if (stage.isDragging()) stage.stopDrag();
    }
    if (lastPinch.current) {
      const view = { scale: stage.scaleX(), x: stage.x(), y: stage.y() };
      const { scale, x, y } = pinchedView(view, lastPinch.current, next);
      stage.scale({ x: scale, y: scale });
      stage.position({ x, y });
    }
    lastPinch.current = next;
  }

  function endPinch() {
    lastPinch.current = null;
  }

  return {
    panOrZoom,
    pinch,
    endPinch,
    panWhereAllowed,
    trackPan,
    endPan,
    stopGlide,
    viewCenter,
    fitMap,
    centerOn,
    zoomIn,
    zoomOut,
  };
}
