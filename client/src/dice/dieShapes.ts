import type { DieSides } from "../../../shared/dice";

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

function kite(radius: number) {
  const side = radius * 0.85;
  const shoulder = -radius * 0.1;
  return [0, -radius, side, shoulder, 0, radius, -side, shoulder];
}

// Flat outlines centred on 0,0 as [x1, y1, x2, y2, …], so the kinds of dice are told apart at a glance.
export function dieShape(sides: DieSides, radius: number): number[] {
  switch (sides) {
    case 4:
      return polygon(3, radius);
    case 6:
      return polygon(4, radius, -Math.PI / 4);
    case 8:
      return polygon(4, radius, POINT_UP, 1.2);
    case 10:
    case 100:
      return kite(radius);
    case 12:
      return polygon(5, radius);
    case 20:
      return polygon(6, radius);
  }
}
