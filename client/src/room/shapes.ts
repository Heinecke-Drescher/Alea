import type { Vector2d } from "konva/lib/types";
import { CELL_SIZE, toCells } from "./grid";

export type ShapeKind = "cone" | "square" | "circle";

export interface AreaShape {
  kind: ShapeKind;
  from: Vector2d;
  to: Vector2d;
}

export function isShapeKind(value: unknown): value is ShapeKind {
  return value === "cone" || value === "square" || value === "circle";
}

export function shiftShape(
  { kind, from, to }: AreaShape,
  dx: number,
  dy: number,
): AreaShape {
  return {
    kind,
    from: { x: from.x + dx, y: from.y + dy },
    to: { x: to.x + dx, y: to.y + dy },
  };
}

// Takes over only the known fields, also from other players' data.
export function copyShape(shape: AreaShape) {
  return shiftShape(shape, 0, 0);
}

// A cone is as wide as it is long at every point (D&D 5e), so each side opens by atan(1/2).
const CONE_HALF_ANGLE = Math.atan(1 / 2);
const CIRCLE_CORNERS = 64;

export function shapeCells({ kind, from, to }: AreaShape) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance =
    kind === "square"
      ? Math.max(Math.abs(dx), Math.abs(dy))
      : Math.hypot(dx, dy);
  return toCells(distance);
}

export function shapeOutline(shape: AreaShape): number[] | null {
  const { kind, from, to } = shape;
  const cells = shapeCells(shape);
  if (cells === 0) return null;
  const size = cells * CELL_SIZE;
  switch (kind) {
    case "cone":
      return coneOutline(from, Math.atan2(to.y - from.y, to.x - from.x), size);
    case "square":
      return squareOutline(from, to, size);
    case "circle":
      return circleOutline(from, size);
  }
}

function coneOutline(origin: Vector2d, direction: number, length: number) {
  const corner = length / Math.cos(CONE_HALF_ANGLE);
  return [
    origin.x,
    origin.y,
    ...[-CONE_HALF_ANGLE, CONE_HALF_ANGLE].flatMap((offset) => [
      origin.x + Math.cos(direction + offset) * corner,
      origin.y + Math.sin(direction + offset) * corner,
    ]),
  ];
}

function squareCorner(from: Vector2d, to: Vector2d, side: number) {
  return {
    x: from.x + (Math.sign(to.x - from.x) || 1) * side,
    y: from.y + (Math.sign(to.y - from.y) || 1) * side,
  };
}

function squareOutline(from: Vector2d, to: Vector2d, side: number) {
  const { x, y } = squareCorner(from, to, side);
  return [from.x, from.y, x, from.y, x, y, from.x, y];
}

// Moves `to` to where the shape really ends, so its size stays the same when computed again.
export function fitShape(shape: AreaShape): AreaShape {
  const { kind, from, to } = shape;
  const size = shapeCells(shape) * CELL_SIZE;
  const direction = Math.atan2(to.y - from.y, to.x - from.x);
  const end =
    kind === "square"
      ? squareCorner(from, to, size)
      : {
          x: from.x + Math.cos(direction) * size,
          y: from.y + Math.sin(direction) * size,
        };
  return { kind, from: { x: from.x, y: from.y }, to: end };
}

function circleOutline(center: Vector2d, radius: number) {
  return Array.from(
    { length: CIRCLE_CORNERS },
    (_, i) => (i / CIRCLE_CORNERS) * 2 * Math.PI,
  ).flatMap((angle) => [
    center.x + Math.cos(angle) * radius,
    center.y + Math.sin(angle) * radius,
  ]);
}
