import type { DieSides } from "../../../shared/dice";
import { dieShape } from "./dieShapes";

const RADIUS = 10;

export function DieIcon({ sides }: { sides: DieSides }) {
  const points = dieShape(sides, RADIUS).join(" ");
  const size = RADIUS * 2.6;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      aria-hidden
    >
      <polygon
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
