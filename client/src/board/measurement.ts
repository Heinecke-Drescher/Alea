import { clamp } from "@mantine/hooks";
import type { Vector2d } from "konva/lib/types";
import type { MapBounds } from "../room/grid";

export interface Measurement {
  from: Vector2d;
  to: Vector2d;
}

export const MEASUREMENT_LABEL_SIZE = { width: 112, height: 64 };

export function measurementLabelPosition(
  midpoint: Vector2d,
  view: { x: number; y: number; zoom: number; width: number; height: number },
): Vector2d {
  const screenX = clamp(
    midpoint.x * view.zoom + view.x + 10,
    4,
    Math.max(4, view.width - MEASUREMENT_LABEL_SIZE.width - 4),
  );
  const screenY = clamp(
    midpoint.y * view.zoom + view.y + 10,
    4,
    Math.max(4, view.height - MEASUREMENT_LABEL_SIZE.height - 4),
  );
  return {
    x: (screenX - view.x) / view.zoom,
    y: (screenY - view.y) / view.zoom,
  };
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
