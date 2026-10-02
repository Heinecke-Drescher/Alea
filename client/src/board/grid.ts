import { clamp } from "@mantine/hooks";
import type { IRect } from "konva/lib/types";

export const CELL_SIZE = 50;

// In cells. The map can grow in every direction, so x and y may be negative.
export interface MapBounds {
  x: number;
  y: number;
  columns: number;
  rows: number;
}

export const DEFAULT_MAP_BOUNDS: MapBounds = {
  x: 0,
  y: 0,
  columns: 30,
  rows: 20,
};
export const MIN_MAP_CELLS = 5;
export const MAX_MAP_CELLS = 100;

export function mapRect({ x, y, columns, rows }: MapBounds): IRect {
  return {
    x: x * CELL_SIZE,
    y: y * CELL_SIZE,
    width: columns * CELL_SIZE,
    height: rows * CELL_SIZE,
  };
}

export function containsCell(bounds: MapBounds, x: number, y: number) {
  return (
    x >= bounds.x &&
    y >= bounds.y &&
    x < bounds.x + bounds.columns &&
    y < bounds.y + bounds.rows
  );
}

// Keeps the edge opposite to the dragged anchor in place when the size hits its limits.
export function snapMapBounds(box: IRect, anchor: string): MapBounds {
  const toCells = (pixels: number) => Math.round(pixels / CELL_SIZE);
  const limit = (cells: number) => clamp(cells, MIN_MAP_CELLS, MAX_MAP_CELLS);
  const left = toCells(box.x);
  const top = toCells(box.y);
  const right = toCells(box.x + box.width);
  const bottom = toCells(box.y + box.height);
  const columns = limit(right - left);
  const rows = limit(bottom - top);
  return {
    x: anchor.includes("left") ? right - columns : left,
    y: anchor.includes("top") ? bottom - rows : top,
    columns,
    rows,
  };
}

export function isValidMapBounds({ x, y, columns, rows }: MapBounds) {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    [columns, rows].every(
      (cells) =>
        Number.isInteger(cells) &&
        cells >= MIN_MAP_CELLS &&
        cells <= MAX_MAP_CELLS,
    )
  );
}
