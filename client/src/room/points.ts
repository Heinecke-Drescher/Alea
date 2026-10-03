import type { Vector2d } from "konva/lib/types";

export function toPoints(flat: number[]): Vector2d[] {
  if (flat.length < 2 || flat.length % 2 !== 0) {
    throw new Error(`Invalid point list of ${flat.length} values`);
  }
  const points: Vector2d[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    const x = flat[i];
    const y = flat[i + 1];
    if (x === undefined || y === undefined) {
      throw new Error("Invalid point list");
    }
    points.push({ x, y });
  }
  return points;
}

export function segments(flat: number[]) {
  const points = toPoints(flat);
  return points.slice(1).map((to, i) => {
    const from = points[i];
    if (!from) throw new Error("Invalid point list");
    return { from, to, length: Math.hypot(to.x - from.x, to.y - from.y) };
  });
}
