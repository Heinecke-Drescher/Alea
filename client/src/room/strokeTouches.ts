import type { Vector2d } from "konva/lib/types";
import { segments } from "./points";

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function strokeTouches(points: number[], area: Area) {
  if (points.length < 4) throw new Error("A stroke needs at least two points");
  return segments(points).some(({ from, to }) =>
    segmentTouches(from, to, area),
  );
}

// Liang–Barsky: narrows the part of the segment that lies inside each edge.
function segmentTouches(start: Vector2d, end: Vector2d, area: Area) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const edges = [
    [-dx, start.x - area.x],
    [dx, area.x + area.width - start.x],
    [-dy, start.y - area.y],
    [dy, area.y + area.height - start.y],
  ] as const;
  let enter = 0;
  let leave = 1;
  for (const [direction, distance] of edges) {
    if (direction === 0) {
      if (distance < 0) return false;
      continue;
    }
    const t = distance / direction;
    if (direction < 0) enter = Math.max(enter, t);
    else leave = Math.min(leave, t);
    if (enter > leave) return false;
  }
  return true;
}
