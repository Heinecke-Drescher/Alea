import { Group } from "react-konva";
import { CELL_SIZE } from "../../room/grid";
import { DashedFrame } from "../selection/DashedFrame";
import type { FogFrame as Frame } from "./fog";

export function FogFrame({ frame }: { frame: Frame | null }) {
  if (!frame) return null;
  const { from, to } = frame;

  return (
    <Group
      x={Math.min(from.x, to.x) * CELL_SIZE}
      y={Math.min(from.y, to.y) * CELL_SIZE}
      listening={false}
    >
      <DashedFrame
        width={(Math.abs(to.x - from.x) + 1) * CELL_SIZE}
        height={(Math.abs(to.y - from.y) + 1) * CELL_SIZE}
      />
    </Group>
  );
}
