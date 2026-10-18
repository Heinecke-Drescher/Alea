import { useMantineTheme } from "@mantine/core";
import { Rect } from "react-konva";
import { CELL_SIZE } from "../../room/grid";
import { HIGHLIGHT_OPACITY, highlightColor } from "../selection/highlight";
import type { FogFrame as Frame } from "./fog";

export function FogFrame({ frame }: { frame: Frame | null }) {
  const theme = useMantineTheme();
  if (!frame) return null;
  const { from, to } = frame;
  const left = Math.min(from.x, to.x);
  const top = Math.min(from.y, to.y);
  const color = highlightColor(theme);

  return (
    <Rect
      x={left * CELL_SIZE}
      y={top * CELL_SIZE}
      width={(Math.abs(to.x - from.x) + 1) * CELL_SIZE}
      height={(Math.abs(to.y - from.y) + 1) * CELL_SIZE}
      stroke={color}
      strokeWidth={2}
      dash={[8, 4]}
      fill={color}
      opacity={HIGHLIGHT_OPACITY}
      listening={false}
    />
  );
}
