import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";

// The cells of the "1" in the order the die tumbles over them, in a grid of 3 × 6. A tumbling
// die can only go straight, so it goes back over its own trail twice. It never makes the last
// step: the right end of the foot stays missing.
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
export const TUMBLE_SECONDS = (PATH.length - 2) * STEP_SECONDS;
// How thin the die looks along its way when it stands on its edge halfway through a step.
const EDGE_THINNING = 0.6;
const RISE_SECONDS = 0.3;
const WOBBLE_SECONDS = 0.35;
const FALL_SECONDS = 0.15;
const BOUNCE_SECONDS = 0.1;
export const STUMBLE_SECONDS =
  RISE_SECONDS + WOBBLE_SECONDS + FALL_SECONDS + BOUNCE_SECONDS;
const WOBBLES = 2.5;
const WOBBLE_SIZE = 0.08;
const BOUNCE_SIZE = 0.08;
const CRACK_POINTS = 9;
// Share of a cell the crack may swing to each side.
const CRACK_SWING = 0.25;
export const CRACK_SECONDS = 0.8;
export const TOPPLE_SECONDS = 0.6;
const TOPPLE_BOUNCE_SECONDS = 0.25;
// In degrees.
const TOPPLE_BOUNCE = 6;
export const TOPPLED_SECONDS = TOPPLE_SECONDS + TOPPLE_BOUNCE_SECONDS;

// The size of a cell of the "1", so it fits on small screens too.
export function oneSpacing(area: IRect) {
  return Math.min(
    (area.width * ONE_SHARE) / ONE_COLUMNS,
    (area.height * ONE_SHARE) / ONE_ROWS,
  );
}

export interface OnePath {
  trail: Vector2d[];
  missed: Vector2d;
}

// Starts where the die landed, moved just enough that the whole "1" lies inside the area.
export function onePath(
  landed: Vector2d,
  spacing: number,
  area: IRect,
): OnePath {
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
  const places = PATH.map(({ x, y }) => ({
    x: left + (x + 0.5) * spacing,
    y: top + (y + 0.5) * spacing,
  }));
  const missed = places.pop();
  if (!missed) throw new Error("The path of the 1 is empty");
  return { trail: places, missed };
}

export interface DiePose extends Vector2d {
  scaleX: number;
  scaleY: number;
}

export interface TumblePose extends DiePose {
  // How many places of the trail the die has reached, the start included.
  reached: number;
}

// `share` of a step from 0 (flat on `from`) over 0.5 (on its edge) to 1 (flat on `to`).
function poseBetween(from: Vector2d, to: Vector2d, share: number): DiePose {
  const moved = (1 - Math.cos(share * Math.PI)) / 2;
  const thin = 1 - EDGE_THINNING * Math.sin(share * Math.PI);
  const sideways = from.x !== to.x;
  return {
    x: from.x + (to.x - from.x) * moved,
    y: from.y + (to.y - from.y) * moved,
    scaleX: sideways ? thin : 1,
    scaleY: sideways ? 1 : thin,
  };
}

export function tumblePose(trail: Vector2d[], seconds: number): TumblePose {
  const steps = trail.length - 1;
  const progress = clamp(seconds / STEP_SECONDS, 0, steps);
  const step = Math.min(Math.floor(progress), steps - 1);
  const from = trail[step];
  const to = trail[step + 1];
  if (!from || !to) throw new Error("A tumble needs at least two places");
  return {
    ...poseBetween(from, to, progress - step),
    reached: Math.floor(progress) + 1,
  };
}

function stumbleShare(seconds: number) {
  const falling = seconds - RISE_SECONDS - WOBBLE_SECONDS;
  if (seconds < RISE_SECONDS) {
    return 0.5 * Math.sin(((seconds / RISE_SECONDS) * Math.PI) / 2);
  }
  if (falling < 0) {
    const wobbled = (seconds - RISE_SECONDS) / WOBBLE_SECONDS;
    return (
      0.5 +
      WOBBLE_SIZE * Math.sin(wobbled * WOBBLES * 2 * Math.PI) * (1 - wobbled)
    );
  }
  if (falling < FALL_SECONDS) return 0.5 * (1 - (falling / FALL_SECONDS) ** 2);
  const bounced = Math.min((falling - FALL_SECONDS) / BOUNCE_SECONDS, 1);
  return BOUNCE_SIZE * Math.sin(bounced * Math.PI);
}

// The last step fails: the die rises onto its edge towards `to`, wobbles and falls back.
export function stumblePose(
  from: Vector2d,
  to: Vector2d,
  seconds: number,
): DiePose {
  return poseBetween(from, to, stumbleShare(Math.max(seconds, 0)));
}

// Each place once, although the die goes over some twice.
export function stampedPlaces(trail: Vector2d[], reached: number): Vector2d[] {
  const seen = new Set<string>();
  return trail.slice(0, reached).filter(({ x, y }) => {
    const key = `${x},${y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// A zigzag from where the die fell back up the stem to the top of the "1"; the fall cracked it.
export function crackPoints(
  trail: Vector2d[],
  spacing: number,
  random = Math.random,
): Vector2d[] {
  const die = trail.at(-1);
  if (!die) throw new Error("The trail of the 1 is empty");
  const top = Math.min(...trail.map((place) => place.y)) - spacing / 2;
  return Array.from({ length: CRACK_POINTS }, (_, i) => ({
    x: die.x + (i === 0 ? 0 : (random() * 2 - 1) * CRACK_SWING * spacing),
    y: die.y + (i / (CRACK_POINTS - 1)) * (top - die.y),
  }));
}

export function topplePivot(trail: Vector2d[], spacing: number): Vector2d {
  const last = trail.at(-1);
  if (!last) throw new Error("The trail of the 1 is empty");
  return { x: last.x + spacing / 2, y: last.y + spacing / 2 };
}

// In degrees, faster and faster like a falling tower, until it lies at `landed` and bounces once.
export function toppleAngle(seconds: number, landed: number) {
  if (seconds <= 0) return 0;
  if (seconds < TOPPLE_SECONDS) return landed * (seconds / TOPPLE_SECONDS) ** 2;
  const bounced = Math.min(
    (seconds - TOPPLE_SECONDS) / TOPPLE_BOUNCE_SECONDS,
    1,
  );
  return landed - TOPPLE_BOUNCE * Math.sin(bounced * Math.PI);
}

// The crack as far as it has grown, `seconds` after it began; it ends between two points.
export function grownCrack(points: Vector2d[], seconds: number): Vector2d[] {
  const reach =
    clamp(seconds / CRACK_SECONDS, 0, 1) * Math.max(points.length - 1, 0);
  const whole = Math.floor(reach);
  const grown = points.slice(0, whole + 1);
  const from = points[whole];
  const to = points[whole + 1];
  if (from && to && reach > whole) {
    const share = reach - whole;
    grown.push({
      x: from.x + (to.x - from.x) * share,
      y: from.y + (to.y - from.y) * share,
    });
  }
  return grown;
}
