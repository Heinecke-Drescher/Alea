import { UnstyledButton } from "@mantine/core";
import type { DieSides } from "../../../shared/dice";
import { startDieDrag } from "./dieDrag";
import classes from "./DieButton.module.css";
import { dieShape } from "./dieShapes";

const RADIUS = 24;
const VIEW_SIZE = RADIUS * 2.4;

interface DieButtonProps {
  sides: DieSides;
  onRoll: () => void;
}

export function DieButton({ sides, onRoll }: DieButtonProps) {
  return (
    <UnstyledButton
      className={classes.button}
      aria-label={`Roll d${sides}`}
      draggable
      onDragStart={(event) => startDieDrag(event.dataTransfer, sides)}
      onClick={onRoll}
    >
      <svg
        viewBox={`${-VIEW_SIZE / 2} ${-VIEW_SIZE / 2} ${VIEW_SIZE} ${VIEW_SIZE}`}
        className={classes.die}
        aria-hidden
      >
        <polygon
          className={classes.shape}
          points={dieShape(sides, RADIUS).join(" ")}
        />
        <text
          className={classes.label}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={sides === 100 ? 11 : 14}
        >
          d{sides}
        </text>
      </svg>
    </UnstyledButton>
  );
}
