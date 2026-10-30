import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";

// The cells of the "1" in the order the die tumbles over them, in a grid of 3 × 6. A tumbling
// die can only go straight, so it goes back over its own trail twice.
const PATH: Vector2d[] = [
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: 2 },
  { x: 1, y: 3 },
  { x: 1, y: 4 },
  { x: 1, y: 5 },
  { x: 0, y: 5 },
  { x: 1, y: 5 },
  { x: 2, y: 5 },
];
const ONE_COLUMNS = 3;
const ONE_ROWS = 6;
// Share of the area's width and height the "1" may take.
const ONE_SHARE = 0.5;
export const STEP_SECONDS = 0.25;
export const TUMBLE_SECONDS = (PATH.length - 1) * STEP_SECONDS;
// How thin the die looks along its way when it stands on its edge halfway through a step.
const EDGE_THINNING = 0.6;

// The size of a cell of the "1", so it fits on small screens too.
export function oneSpacing(area: IRect) {
  return Math.min(
    (area.width * ONE_SHARE) / ONE_COLUMNS,
    (area.height * ONE_SHARE) / ONE_ROWS,
  );
}

// Starts where the die landed, moved just enough that the whole "1" lies inside the area.
export function onePath(
  landed: Vector2d,
  spacing: number,
  area: IRect,
): Vector2d[] {
  const [first] = PATH;
  if (!first) throw new Error("The path of the 1 is empty");
  const left = clamp(
    landed.x - (first.x + 0.5) * spacing,
    area.x,
    area.x + area.width - ONE_COLUMNS * spacing,
  );
  const top = clamp(
    landed.y - (first.y + 0.5) * spacing,
    area.y,
    area.y + area.height - ONE_ROWS * spacing,
  );
  return PATH.map(({ x, y }) => ({
    x: left + (x + 0.5) * spacing,
    y: top + (y + 0.5) * spacing,
  }));
}

export interface TumblePose extends Vector2d {
  scaleX: number;
  scaleY: number;
  // How many places of the path the die has reached, the start included.
  reached: number;
}

export function tumblePose(path: Vector2d[], seconds: number): TumblePose {
  const steps = path.length - 1;
  const progress = clamp(seconds / STEP_SECONDS, 0, steps);
  const step = Math.min(Math.floor(progress), steps - 1);
  const from = path[step];
  const to = path[step + 1];
  if (!from || !to) throw new Error("A tumble needs at least two places");
  const share = progress - step;
  const moved = (1 - Math.cos(share * Math.PI)) / 2;
  const thin = 1 - EDGE_THINNING * Math.sin(share * Math.PI);
  const sideways = from.x !== to.x;
  return {
    x: from.x + (to.x - from.x) * moved,
    y: from.y + (to.y - from.y) * moved,
    scaleX: sideways ? thin : 1,
    scaleY: sideways ? 1 : thin,
    reached: Math.floor(progress) + 1,
  };
}

// Each place once, although the die goes over some twice.
export function stampedPlaces(path: Vector2d[], reached: number): Vector2d[] {
  const seen = new Set<string>();
  return path.slice(0, reached).filter(({ x, y }) => {
    const key = `${x},${y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
