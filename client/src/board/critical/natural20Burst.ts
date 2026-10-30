import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";

export interface BurstDie {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  target: Vector2d;
}

// In diagonals of the area per second, so the burst looks the same on any map and zoom.
const MIN_SPEED = 1;
const MAX_SPEED = 1.7;
const MAX_SPIN = 720;
// Rate at which the speed decays (speed × e^(−DRAG × seconds)), so the dice slow down before they gather.
const DRAG = 0.5;
const KEPT_AFTER_BOUNCE = 0.8;
// A long frame, e.g. after the tab was in the background, must not carry a die far past an edge.
const MAX_STEP_SECONDS = 1 / 30;
// Share of the area's width and height the number may take.
const TWENTY_SHARE = 0.6;

// Each digit is a 5 × 7 grid; every # becomes one die.
const DIGITS = {
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
};
const DIGIT_COLUMNS = 5;
const DIGIT_ROWS = 7;
const DIGIT_GAP = 1;
const TWENTY_COLUMNS = 2 * DIGIT_COLUMNS + DIGIT_GAP;
const TWENTY_ROWS = DIGIT_ROWS;

// The distance between neighbouring dice, so the number fits on small screens too.
export function twentySpacing(area: IRect) {
  return Math.min(
    (area.width * TWENTY_SHARE) / TWENTY_COLUMNS,
    (area.height * TWENTY_SHARE) / TWENTY_ROWS,
  );
}

export function twentyTargets(center: Vector2d, spacing: number): Vector2d[] {
  const left = center.x - ((TWENTY_COLUMNS - 1) * spacing) / 2;
  const top = center.y - ((TWENTY_ROWS - 1) * spacing) / 2;
  return [DIGITS["2"], DIGITS["0"]].flatMap((rows, digit) =>
    rows.flatMap((row, y) =>
      [...row].flatMap((pixel, x) =>
        pixel === "#"
          ? [
              {
                x: left + (digit * (DIGIT_COLUMNS + DIGIT_GAP) + x) * spacing,
                y: top + y * spacing,
              },
            ]
          : [],
      ),
    ),
  );
}

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Spread evenly around the circle with a little jitter, so no direction stays empty.
// A rolled die outside the area bursts from the nearest point inside it.
export function burstDice(
  start: Vector2d,
  targets: Vector2d[],
  area: IRect,
  radius: number,
): BurstDie[] {
  const x = clamp(start.x, area.x + radius, area.x + area.width - radius);
  const y = clamp(start.y, area.y + radius, area.y + area.height - radius);
  const diagonal = Math.hypot(area.width, area.height);
  return targets.map((target, i) => {
    const angle = ((i + Math.random()) / targets.length) * 2 * Math.PI;
    const speed = between(MIN_SPEED, MAX_SPEED) * diagonal;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: 0,
      spin: between(-MAX_SPIN, MAX_SPIN),
      target,
    };
  });
}

// The velocity always points back inside after a bounce, even if the die was still outside.
function bounce(position: number, velocity: number, min: number, max: number) {
  if (position < min) {
    return {
      position: clamp(2 * min - position, min, max),
      velocity: Math.abs(velocity) * KEPT_AFTER_BOUNCE,
    };
  }
  if (position > max) {
    return {
      position: clamp(2 * max - position, min, max),
      velocity: -Math.abs(velocity) * KEPT_AFTER_BOUNCE,
    };
  }
  return { position, velocity };
}

export function moveBurstDie(
  die: BurstDie,
  seconds: number,
  area: IRect,
  radius: number,
): BurstDie {
  const step = Math.min(seconds, MAX_STEP_SECONDS);
  const slowdown = Math.exp(-DRAG * step);
  const x = bounce(
    die.x + die.vx * step,
    die.vx,
    area.x + radius,
    area.x + area.width - radius,
  );
  const y = bounce(
    die.y + die.vy * step,
    die.vy,
    area.y + radius,
    area.y + area.height - radius,
  );
  return {
    x: x.position,
    y: y.position,
    vx: x.velocity * slowdown,
    vy: y.velocity * slowdown,
    rotation: die.rotation + die.spin * step,
    spin: die.spin * slowdown,
    target: die.target,
  };
}

export interface GatheredDie extends Vector2d {
  rotation: number;
  scale: number;
}

// The dice are caught one after another over this time, the nearest to its place first.
const CATCH_SPREAD_SECONDS = 0.4;
const FLIGHT_SECONDS = 0.9;
const POP_SECONDS = 0.25;
const POP_SCALE = 0.15;
// Share of its speed a caught die keeps; all of it would swing it far past the edges.
const KEPT_MOMENTUM = 0.5;
export const GATHER_SECONDS =
  CATCH_SPREAD_SECONDS + FLIGHT_SECONDS + POP_SECONDS;

export function catchDelays(dice: BurstDie[]): number[] {
  const distances = dice.map((die) =>
    Math.hypot(die.target.x - die.x, die.target.y - die.y),
  );
  const order = [...distances].sort((a, b) => a - b);
  const last = Math.max(dice.length - 1, 1);
  return distances.map(
    (distance) => (order.indexOf(distance) / last) * CATCH_SPREAD_SECONDS,
  );
}

// Cubic Hermite curve: leaves `start` with `slope` and stops at `end`.
function hermite(start: number, slope: number, end: number, progress: number) {
  const t = progress;
  return (
    (2 * t ** 3 - 3 * t ** 2 + 1) * start +
    (t ** 3 - 2 * t ** 2 + t) * slope +
    (-2 * t ** 3 + 3 * t ** 2) * end
  );
}

// Curves from the die's flight into its place without a kink, comes to rest upright
// and pops once on arrival.
export function gatheredDie(caught: BurstDie, seconds: number): GatheredDie {
  const progress = clamp(seconds / FLIGHT_SECONDS, 0, 1);
  const keep = KEPT_MOMENTUM * FLIGHT_SECONDS;
  // Where its turning would come to rest by itself, rounded to upright.
  const upright =
    Math.round((caught.rotation + (caught.spin * keep) / 2) / 360) * 360;
  const popped = (seconds - FLIGHT_SECONDS) / POP_SECONDS;
  return {
    x: hermite(caught.x, caught.vx * keep, caught.target.x, progress),
    y: hermite(caught.y, caught.vy * keep, caught.target.y, progress),
    rotation: hermite(caught.rotation, caught.spin * keep, upright, progress),
    scale:
      popped > 0 && popped < 1 ? 1 + POP_SCALE * Math.sin(popped * Math.PI) : 1,
  };
}
