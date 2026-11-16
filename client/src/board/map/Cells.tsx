import { useMantineTheme } from "@mantine/core";
import type { IRect } from "konva/lib/types";
import { Group, Rect } from "react-konva";
import { isTouchedBy } from "../../room/areaActions";
import { CELL_SIZE } from "../../room/grid";
import { cellKey } from "../../room/roomStore";
import { useCells } from "../../room/useCells";
import { HIGHLIGHT_OPACITY, highlightColor } from "../selection/highlight";

interface CellsProps {
  selection: IRect | null;
}

export function Cells({ selection }: CellsProps) {
  const theme = useMantineTheme();
  const cells = useCells();

  return (
    <Group listening={false}>
      {cells.map((cell) => (
        <Rect
          key={cellKey(cell.x, cell.y)}
          x={cell.x * CELL_SIZE}
          y={cell.y * CELL_SIZE}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={cell.color}
        />
      ))}
      {cells
        .filter(
          (cell) => selection && isTouchedBy(selection, cell.x, cell.y, 1),
        )
        .map((cell) => (
          <Rect
            key={`highlight-${cellKey(cell.x, cell.y)}`}
            x={cell.x * CELL_SIZE}
            y={cell.y * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={highlightColor(theme)}
            opacity={HIGHLIGHT_OPACITY}
          />
        ))}
    </Group>
  );
}
