import type { Vector2d } from "konva/lib/types";
import { CELL_SIZE, clampToMap, mapRect, type MapBounds } from "../room/grid";

export interface DragSample {
  x: number;
  y: number;
  time: number;
}

export const MAX_THROW_DISTANCE = 4 * CELL_SIZE;
export const SWING_WINDOW_MS = 100;
const SECONDS_OF_ROLLING = 0.25;
const KEPT_AFTER_BOUNCE = 0.6;
const MAX_BOUNCES = 6;

function distanceToEdge(
  position: number,
  direction: number,
  start: number,
  end: number,
) {
  if (direction > 0) return (end - position) / direction;
  if (direction < 0) return (start - position) / direction;
  return Infinity;
}

function pathPoints(path: number[]): Vector2d[] {
  if (path.length < 2 || path.length % 2 !== 0) {
    throw new Error(`Invalid path of ${path.length} values`);
  }
  const points: Vector2d[] = [];
  for (let i = 0; i < path.length; i += 2) {
    const x = path[i];
    const y = path[i + 1];
    if (x === undefined || y === undefined) throw new Error("Invalid path");
    points.push({ x, y });
  }
  return points;
}

function segments(path: number[]) {
  const points = pathPoints(path);
  return points.slice(1).map((to, i) => {
    const from = points[i];
    if (!from) throw new Error("Invalid path");
    return { from, to, length: Math.hypot(to.x - from.x, to.y - from.y) };
  });
}

export function pathLength(path: number[]) {
  return segments(path).reduce((sum, { length }) => sum + length, 0);
}

export function pointAlong(path: number[], distance: number): Vector2d {
  let left = distance;
  for (const { from, to, length } of segments(path)) {
    if (left <= length) {
      const share = length === 0 ? 0 : left / length;
      return {
        x: from.x + (to.x - from.x) * share,
        y: from.y + (to.y - from.y) * share,
      };
    }
    left -= length;
  }
  const end = pathPoints(path).at(-1);
  if (!end) throw new Error("Invalid path");
  return end;
}

export function dragVelocity(samples: DragSample[]): Vector2d {
  const last = samples.at(-1);
  if (!last) return { x: 0, y: 0 };
  const first = samples.find(
    (sample) => last.time - sample.time <= SWING_WINDOW_MS,
  );
  if (!first || first.time === last.time) return { x: 0, y: 0 };
  const seconds = (last.time - first.time) / 1000;
  return {
    x: (last.x - first.x) / seconds,
    y: (last.y - first.y) / seconds,
  };
}

export function throwPath(
  drop: Vector2d,
  velocity: Vector2d,
  bounds: MapBounds,
): number[] {
  const map = mapRect(bounds);
  let point = clampToMap(drop, bounds);
  const path = [point.x, point.y];
  const speed = Math.hypot(velocity.x, velocity.y);
  let remaining = Math.min(speed * SECONDS_OF_ROLLING, MAX_THROW_DISTANCE);
  if (remaining === 0) return [...path, point.x, point.y];
  let direction = { x: velocity.x / speed, y: velocity.y / speed };

  for (let bounces = 0; ; bounces++) {
    const toSide = distanceToEdge(
      point.x,
      direction.x,
      map.x,
      map.x + map.width,
    );
    const toTopOrBottom = distanceToEdge(
      point.y,
      direction.y,
      map.y,
      map.y + map.height,
    );
    const toEdge = Math.min(toSide, toTopOrBottom);
    const step = Math.min(remaining, toEdge);
    point = {
      x: point.x + direction.x * step,
      y: point.y + direction.y * step,
    };
    path.push(point.x, point.y);
    if (remaining <= toEdge || bounces === MAX_BOUNCES) return path;
    direction = {
      x: toSide <= toTopOrBottom ? -direction.x : direction.x,
      y: toTopOrBottom <= toSide ? -direction.y : direction.y,
    };
    remaining = (remaining - toEdge) * KEPT_AFTER_BOUNCE;
  }
}
