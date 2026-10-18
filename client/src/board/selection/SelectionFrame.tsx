import { useMantineTheme } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group, Rect } from "react-konva";
import { useRoom } from "../../room/RoomContext";
import { CELL_SIZE } from "../../room/grid";
import { highlightColor } from "./highlight";
import { cellOffset } from "./selection";

interface SelectionFrameProps {
  area: IRect | null;
  onMove: (dx: number, dy: number) => void;
}

function setCursor(event: KonvaEventObject<MouseEvent>, cursor: string) {
  const stage = event.target.getStage();
  if (!stage) throw new Error("Selection is not on a stage");
  stage.container().style.cursor = cursor;
}

export function SelectionFrame({ area, onMove }: SelectionFrameProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const color = highlightColor(theme);

  function snapToCells(event: KonvaEventObject<DragEvent>, frame: IRect) {
    const node = event.target;
    const { dx, dy } = cellOffset(frame, node.position(), room.mapBounds());
    node.position({ x: frame.x + dx * CELL_SIZE, y: frame.y + dy * CELL_SIZE });
    return { dx, dy };
  }

  return (
    <Group>
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
            // React draws the frame from the selection, so the node goes back first.
            event.target.position({ x: area.x, y: area.y });
            onMove(dx, dy);
          }}
        />
      )}
    </Group>
  );
}
