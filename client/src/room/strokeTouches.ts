import type { IRect, Vector2d } from "konva/lib/types";
import { isClosed } from "./drawing";
import { segments } from "./points";
import type { StrokeData } from "./roomStore";

export function strokeTouches(stroke: StrokeData, area: IRect) {
  const { points } = stroke;
  if (points.length < 4) throw new Error("A stroke needs at least two points");
  const outline = isClosed(stroke)
    ? [...points, ...points.slice(0, 2)]
    : points;
  return segments(outline).some(({ from, to }) =>
    segmentTouches(from, to, area),
  );
}

// Liang–Barsky: narrows the part of the segment that lies inside each edge.
function segmentTouches(start: Vector2d, end: Vector2d, area: IRect) {
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
