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
export const MIN_MAP_CELLS = 10;
export const MAX_TOKEN_SIZE = 10;
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

export function clampCellToMap(cell: Vector2d, map: MapBounds): Vector2d {
  return {
    x: clamp(cell.x, map.x, map.x + map.columns - 1),
    y: clamp(cell.y, map.y, map.y + map.rows - 1),
  };
}

export function dropCells(
  start: { x: number; y: number },
  count: number,
  map: MapBounds,
) {
  const rows = Math.ceil(count / map.columns);
  const top = clamp(start.y, map.y, map.y + map.rows - rows);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / map.columns);
    const rowLength = Math.min(map.columns, count - row * map.columns);
    const left = clamp(start.x, map.x, map.x + map.columns - rowLength);
    return { x: left + (i % map.columns), y: top + row };
  });
}

export function containsCell(bounds: MapBounds, x: number, y: number) {
  return (
    x >= bounds.x &&
    y >= bounds.y &&
    x < bounds.x + bounds.columns &&
    y < bounds.y + bounds.rows
  );
}

export function containsSquare(bounds: MapBounds, { x, y, size }: Square) {
  return (
    containsCell(bounds, x, y) &&
    containsCell(bounds, x + size - 1, y + size - 1)
  );
}

export function overlaps(a: Square, b: Square) {
  return (
    a.x < b.x + b.size &&
    b.x < a.x + a.size &&
    a.y < b.y + b.size &&
    b.y < a.y + a.size
  );
}

function clockwiseFromRight({ x, y }: Vector2d) {
  return (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
}

function ringOffsets(distance: number) {
  const offsets: Vector2d[] = [];
  for (let y = -distance; y <= distance; y++) {
    for (let x = -distance; x <= distance; x++) {
      if (Math.max(Math.abs(x), Math.abs(y)) === distance) {
        offsets.push({ x, y });
      }
    }
  }
  return offsets.sort(
    (a, b) =>
      Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) ||
      clockwiseFromRight(a) - clockwiseFromRight(b),
  );
}

export function nearestFreeSquare(
  square: Square,
  occupied: Square[],
  map: MapBounds,
): Vector2d | null {
  const { size } = square;
  const maxDistance = Math.max(map.columns, map.rows);
  for (let distance = 1; distance <= maxDistance; distance++) {
    for (const offset of ringOffsets(distance)) {
      const candidate = {
        x: square.x + offset.x,
        y: square.y + offset.y,
        size,
      };
      const isFree =
        containsSquare(map, candidate) &&
        !occupied.some((other) => overlaps(candidate, other));
      if (isFree) return { x: candidate.x, y: candidate.y };
    }
  }
  return null;
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
