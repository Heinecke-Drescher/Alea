import { Box, UnstyledButton, useMantineTheme } from "@mantine/core";
import type { PointerEventHandler } from "react";
import type { DieSides } from "../room/dice";
import type { PlayerColor } from "../room/playerColors";
import { dieColors } from "./dieColors";
import { startDieDrag } from "./dieDrag";
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
          fontSize={sides === 100 ? 11 : 14}
        >
          d{sides}
        </text>
      </svg>
    </Box>
  );
}

export interface FingerDragHandlers {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
  isPressed: () => boolean;
}

interface DieButtonProps {
  sides: DieSides;
  color: PlayerColor;
  isDraggable: boolean;
  onRoll: () => void;
  fingerDrag?: FingerDragHandlers;
}

export function DieButton({
  sides,
  color,
  isDraggable,
  onRoll,
  fingerDrag,
}: DieButtonProps) {
  return (
    <UnstyledButton
      className={classes.button}
      // The finger drag needs every move, so the browser must not take the touch for scrolling.
      style={fingerDrag && { touchAction: "none" }}
      aria-label={`Roll d${sides}`}
      draggable={isDraggable}
      onDragStart={(event) => {
        // Chrome on Android starts its own drag after a long press; the finger drags the die already.
        if (fingerDrag?.isPressed()) {
          event.preventDefault();
          return;
        }
        startDieDrag(event.dataTransfer, sides);
      }}
      onClick={onRoll}
      onPointerDown={fingerDrag?.onPointerDown}
      onPointerMove={fingerDrag?.onPointerMove}
      onPointerUp={fingerDrag?.onPointerUp}
      onPointerCancel={fingerDrag?.onPointerCancel}
    >
      <DieFace sides={sides} color={color} />
    </UnstyledButton>
  );
}
