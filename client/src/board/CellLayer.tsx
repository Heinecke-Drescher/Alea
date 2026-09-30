import { Layer, Rect } from "react-konva";
import { cellsMap } from "../room/roomDoc";
import { useY } from "../room/useY";
import { CELL_SIZE } from "./grid";

export function CellLayer() {
  const cells = Object.entries(useY(cellsMap));

  return (
    <Layer listening={false}>
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
    </Layer>
  );
}
