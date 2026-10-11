import { clamp } from "@mantine/hooks";
import type { Vector2d } from "konva/lib/types";
import type { MapBounds } from "../room/grid";

export interface Measurement {
  from: Vector2d;
  to: Vector2d;
}

export function cellDistance({ from, to }: Measurement) {
  return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
}

export function measurementCell(cell: Vector2d, map: MapBounds): Vector2d {
  return {
    x: clamp(cell.x, map.x, map.x + map.columns - 1),
    y: clamp(cell.y, map.y, map.y + map.rows - 1),
  };
}
