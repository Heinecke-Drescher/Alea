import type { Vector2d } from "konva/lib/types";

// Puts a label on the side of `at` that faces away from `awayFrom`, where the line goes and a
// finger may rest, `gap` map pixels off `at`. The pointer is the direction the label's tip points in.
export function labelPlace(at: Vector2d, awayFrom: Vector2d, gap: number) {
  const dx = awayFrom.x - at.x;
  const dy = awayFrom.y - at.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const side = dx >= 0 ? -1 : 1;
    return {
      pointer: dx >= 0 ? "right" : "left",
      x: at.x + side * gap,
      y: at.y,
    } as const;
  }
  const side = dy >= 0 ? -1 : 1;
  return {
    pointer: dy >= 0 ? "down" : "up",
    x: at.x,
    y: at.y + side * gap,
  } as const;
}
