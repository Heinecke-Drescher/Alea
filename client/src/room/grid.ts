import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";

export const CELL_SIZE = 50;

// In cells. The map can grow in every direction, so x and y may be negative.
export interface MapBounds {
  x: number;
  y: number;
  columns: number;
  rows: number;
}

// A token's place in cells.
export interface Square {
  x: number;
  y: number;
  size: number;
}

export const DEFAULT_MAP_BOUNDS: MapBounds = {
  x: 0,
  y: 0,
  columns: 30,
  rows: 20,
};
export const MIN_MAP_CELLS = 5;
export const MAX_TOKEN_SIZE = 3;
export const MAX_MAP_CELLS = 100;

export function mapRect({ x, y, columns, rows }: MapBounds): IRect {
  return {
    x: x * CELL_SIZE,
    y: y * CELL_SIZE,
    width: columns * CELL_SIZE,
    height: rows * CELL_SIZE,
  };
}

export function squareCenter(x: number, y: number, size: number): Vector2d {
  return { x: (x + size / 2) * CELL_SIZE, y: (y + size / 2) * CELL_SIZE };
}

export function clampToMap(point: Vector2d, bounds: MapBounds): Vector2d {
  const { x, y, width, height } = mapRect(bounds);
  return {
    x: clamp(point.x, x, x + width),
    y: clamp(point.y, y, y + height),
  };
}

export function cellAt(point: Vector2d) {
  return {
    x: Math.floor(point.x / CELL_SIZE),
    y: Math.floor(point.y / CELL_SIZE),
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

export function snapMapBounds(box: IRect, anchor: string) {
  return snapToCells(box, anchor, MIN_MAP_CELLS, MAX_MAP_CELLS);
}

// Tokens keep their aspect ratio while resized, so the width alone gives their size.
export function snapTokenSquare(box: IRect, anchor: string): Square {
  const { x, y, columns } = snapToCells(
    { ...box, height: box.width },
    anchor,
    1,
    MAX_TOKEN_SIZE,
  );
  return { x, y, size: columns };
}

// Keeps the edge opposite to the dragged anchor in place when the size hits its limits.
function snapToCells(
  box: IRect,
  anchor: string,
  min: number,
  max: number,
): MapBounds {
  const toCells = (pixels: number) => Math.round(pixels / CELL_SIZE);
  const limit = (cells: number) => clamp(cells, min, max);
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
