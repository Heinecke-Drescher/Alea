import { useMantineTheme } from "@mantine/core";
import type { IRect } from "konva/lib/types";
import { Group, Rect } from "react-konva";
import { hasCenterIn } from "../room/areaActions";
import { CELL_SIZE } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { HIGHLIGHT_OPACITY, highlightColor } from "./highlight";

interface CellsProps {
  selection: IRect | null;
}

export function Cells({ selection }: CellsProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const cells = Object.entries(useY(room.cellsMap));

  return (
    <Group listening={false}>
      {cells.map(([key, cell]) => (
        <Rect
          key={key}
          x={cell.x * CELL_SIZE}
          y={cell.y * CELL_SIZE}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={cell.color}
        />
      ))}
      {cells
        .filter(
          ([, cell]) => selection && hasCenterIn(selection, cell.x, cell.y, 1),
        )
        .map(([key, cell]) => (
          <Rect
            key={`highlight-${key}`}
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
