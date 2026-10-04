import { UnstyledButton, useMantineTheme } from "@mantine/core";
import type { DieSides } from "../../../shared/dice";
import type { PlayerColor } from "../room/playerColors";
import { dieColors } from "./dieColors";
import { startDieDrag } from "./dieDrag";
import classes from "./DieButton.module.css";
import { dieShape } from "./dieShapes";

const RADIUS = 24;
const VIEW_SIZE = RADIUS * 2.4;

interface DieButtonProps {
  sides: DieSides;
  color: PlayerColor;
  isDraggable: boolean;
  onRoll: () => void;
}

export function DieButton({
  sides,
  color,
  isDraggable,
  onRoll,
}: DieButtonProps) {
  const theme = useMantineTheme();
  const colors = dieColors(theme, color);

  return (
    <UnstyledButton
      className={classes.button}
      style={{
        "--die-fill": colors.fill,
        "--die-hover-fill": colors.hoverFill,
        "--die-text": colors.text,
      }}
      aria-label={`Roll d${sides}`}
      draggable={isDraggable}
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
