import type { DieSides } from "../room/dice";
import { toPoints } from "../room/points";

const POINT_UP = -Math.PI / 2;

function polygon(
  corners: number,
  radius: number,
  startAngle = POINT_UP,
  stretchY = 1,
) {
  return Array.from({ length: corners }, (_, i) => {
    const angle = startAngle + (i * 2 * Math.PI) / corners;
    return [radius * Math.cos(angle), radius * Math.sin(angle) * stretchY];
  }).flat();
}

// The shoelace formula.
export function outlineArea(flat: number[]) {
  const corners = toPoints(flat);
  const twiceArea = corners.reduce((sum, { x, y }, i) => {
    const next = corners[(i + 1) % corners.length];
    if (!next) throw new Error("Outline without corners");
    return sum + x * next.y - next.x * y;
  }, 0);
  return Math.abs(twiceArea) / 2;
}

function outline(sides: DieSides, radius: number): number[] {
  switch (sides) {
    case 4:
      return polygon(3, radius);
    case 6:
      return polygon(4, radius, -Math.PI / 4);
    case 8:
      return polygon(4, radius, POINT_UP, 1.2);
    case 10:
    case 100:
      // Lying flat and wider than tall, so it is not mistaken for the upright d20.
      return polygon(6, radius, 0, 0.82);
    case 12:
      return polygon(5, radius);
    case 20:
      return polygon(6, radius);
  }
}

// Flat outlines centred on 0,0 as [x1, y1, x2, y2, …], so the kinds of dice are told apart at a glance.
// All cover the d20's area, as a triangle or a square in the d20's circle would look smaller.
export function dieShape(sides: DieSides, radius: number): number[] {
  const points = outline(sides, radius);
  const scale = Math.sqrt(
    outlineArea(outline(20, radius)) / outlineArea(points),
  );
  return points.map((value) => value * scale);
}
