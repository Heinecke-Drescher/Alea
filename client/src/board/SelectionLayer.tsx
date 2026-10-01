import { useMantineTheme } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Layer, Rect } from "react-konva";
import { CELL_SIZE } from "./grid";
import { cellOffset } from "./selection";

interface SelectionLayerProps {
  area: IRect | null;
  onMove: (dx: number, dy: number) => void;
}

function setCursor(event: KonvaEventObject<MouseEvent>, cursor: string) {
  const stage = event.target.getStage();
  if (!stage) throw new Error("Selection is not on a stage");
  stage.container().style.cursor = cursor;
}

export function SelectionLayer({ area, onMove }: SelectionLayerProps) {
  const theme = useMantineTheme();
  const color = theme.colors.blue[6];

  function snapToCells(event: KonvaEventObject<DragEvent>, frame: IRect) {
    const node = event.target;
    const { dx, dy } = cellOffset(frame, node.position());
    node.position({ x: frame.x + dx * CELL_SIZE, y: frame.y + dy * CELL_SIZE });
    return { dx, dy };
  }

  return (
    <Layer>
      {area && (
        <Rect
          {...area}
          fill={color}
          opacity={0.15}
          stroke={color}
          strokeWidth={2}
          dash={[8, 4]}
          strokeScaleEnabled={false}
          draggable
          onMouseEnter={(event) => setCursor(event, "move")}
          onMouseLeave={(event) => setCursor(event, "")}
          onDragMove={(event) => snapToCells(event, area)}
          onDragEnd={(event) => {
            const { dx, dy } = snapToCells(event, area);
            onMove(dx, dy);
          }}
        />
      )}
    </Layer>
  );
}
