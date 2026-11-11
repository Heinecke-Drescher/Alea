import type { Vector2d } from "konva/lib/types";

export interface DragSample {
  x: number;
  y: number;
  time: number;
}

// Only the end of a drag gives a thrown die or a flung map its swing.
export const SWING_WINDOW_MS = 100;

// In pixels per second.
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
