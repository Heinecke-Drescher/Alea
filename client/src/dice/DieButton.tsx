import { Box, UnstyledButton, useMantineTheme } from "@mantine/core";
import type { PointerEventHandler } from "react";
import type { DieSides } from "../room/dice";
import type { PlayerColor } from "../room/playerColors";
import { dieColors } from "./dieColors";
import classes from "./DieButton.module.css";
import { dieShape } from "./dieShapes";

const RADIUS = 24;
const VIEW_SIZE = RADIUS * 2.4;

interface DieFaceProps {
  sides: DieSides;
  color: PlayerColor;
}

export function DieFace({ sides, color }: DieFaceProps) {
  const theme = useMantineTheme();
  const colors = dieColors(theme, color);

  return (
    <Box
      component="span"
      display="block"
      style={{
        "--die-fill": colors.fill,
        "--die-hover-fill": colors.hoverFill,
        "--die-text": colors.text,
      }}
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
          fontSize={14}
        >
          d{sides}
        </text>
      </svg>
    </Box>
  );
}

interface DragHandlers {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
}

interface DieButtonProps {
  sides: DieSides;
  color: PlayerColor;
  onRoll: () => void;
  drag?: DragHandlers;
}

export function DieButton({ sides, color, onRoll, drag }: DieButtonProps) {
  return (
    <UnstyledButton
      className={drag ? classes.draggable : classes.button}
      aria-label={`Roll d${sides}`}
      onClick={onRoll}
      {...drag}
    >
      <DieFace sides={sides} color={color} />
    </UnstyledButton>
  );
}
