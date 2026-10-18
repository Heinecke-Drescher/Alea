import type { Vector2d } from "konva/lib/types";

export interface Measurement {
  from: Vector2d;
  to: Vector2d;
}

export function cellDistance({ from, to }: Measurement) {
  return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
}
