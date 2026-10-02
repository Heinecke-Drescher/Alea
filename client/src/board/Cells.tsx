import { Group, Rect } from "react-konva";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { CELL_SIZE } from "./grid";

export function Cells() {
  const room = useRoom();
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
    </Group>
  );
}
