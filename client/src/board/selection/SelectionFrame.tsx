import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group } from "react-konva";
import { useRoom } from "../../room/RoomContext";
import { CELL_SIZE } from "../../room/grid";
import { DashedFrame } from "./DashedFrame";
import { cellOffset } from "./selection";

interface SelectionFrameProps {
  area: IRect | null;
  draggable: boolean;
  onMove: (dx: number, dy: number) => void;
}

function setCursor(event: KonvaEventObject<MouseEvent>, cursor: string) {
  const stage = event.target.getStage();
  if (!stage) throw new Error("Selection is not on a stage");
  stage.container().style.cursor = cursor;
}

export function SelectionFrame({
  area,
  draggable,
  onMove,
}: SelectionFrameProps) {
  const room = useRoom();

  function snapToCells(event: KonvaEventObject<DragEvent>, frame: IRect) {
    const node = event.target;
    const { dx, dy } = cellOffset(frame, node.position(), room.mapBounds());
    node.position({ x: frame.x + dx * CELL_SIZE, y: frame.y + dy * CELL_SIZE });
    return { dx, dy };
  }

  if (!area) return null;

  return (
    <Group
      x={area.x}
      y={area.y}
      draggable={draggable}
      onMouseEnter={(event) => setCursor(event, "move")}
      onMouseLeave={(event) => setCursor(event, "")}
      onDragMove={(event) => snapToCells(event, area)}
      onDragEnd={(event) => {
        const { dx, dy } = snapToCells(event, area);
        // React draws the frame from the selection, so the node goes back first.
        event.target.position({ x: area.x, y: area.y });
        onMove(dx, dy);
      }}
    >
      <DashedFrame width={area.width} height={area.height} />
    </Group>
  );
}
