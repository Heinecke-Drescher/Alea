import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";
import {
  hasGridContent,
  type Clip,
  type Items,
  type ItemType,
} from "../room/areaActions";
import { CELL_SIZE, mapRect, type MapBounds } from "../room/grid";

export type Selection =
  | { kind: "none" }
  | { kind: "area"; area: IRect }
  | { kind: "items"; items: Items };

export const NO_SELECTION: Selection = { kind: "none" };
export const NO_ITEMS: Items = { strokes: [], tokens: [] };

export function areaSelection(area: IRect | null): Selection {
  return area ? { kind: "area", area } : NO_SELECTION;
}

export function itemsSelection(items: Items): Selection {
  const isEmpty = Object.values(items).every((ids) => ids.length === 0);
  return isEmpty ? NO_SELECTION : { kind: "items", items };
}

export function selectedArea(selection: Selection) {
  return selection.kind === "area" ? selection.area : null;
}

export function selectedItems(selection: Selection) {
  return selection.kind === "items" ? selection.items : NO_ITEMS;
}

export function withPressedItem(
  selection: Selection,
  type: ItemType,
  id: string,
  isAdding: boolean,
): Selection {
  const items = selectedItems(selection);
  if (items[type].includes(id)) return selection;
  return itemsSelection(
    isAdding
      ? { ...items, [type]: [...items[type], id] }
      : { ...NO_ITEMS, [type]: [id] },
  );
}

export function withoutItem(
  selection: Selection,
  type: ItemType,
  id: string,
): Selection {
  const items = selectedItems(selection);
  return itemsSelection({
    ...items,
    [type]: items[type].filter((other) => other !== id),
  });
}

export function boxBetween(start: Vector2d, end: Vector2d): IRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function linesBounds(lines: number[][]): IRect {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const points of lines) {
    points.forEach((value, i) => {
      if (i % 2 === 0) {
        left = Math.min(left, value);
        right = Math.max(right, value);
      } else {
        top = Math.min(top, value);
        bottom = Math.max(bottom, value);
      }
    });
  }
  if (left > right) throw new Error("Cannot bound lines without points");
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function clipBounds(clip: Clip): IRect {
  if (!hasGridContent(clip)) {
    return linesBounds(clip.strokes.map((stroke) => stroke.points));
  }
  // Strokes may stick out of the map, so only cells and tokens keep a paste on it.
  return squaresBounds([
    ...clip.cells.map((cell) => ({ ...cell, size: 1 })),
    ...clip.tokens,
  ]);
}

export function squaresBounds(
  squares: { x: number; y: number; size: number }[],
): IRect {
  return linesBounds(
    squares.map(({ x, y, size }) => [
      x * CELL_SIZE,
      y * CELL_SIZE,
      (x + size) * CELL_SIZE,
      (y + size) * CELL_SIZE,
    ]),
  );
}

export function clipToMap(box: IRect, map: MapBounds): IRect | null {
  const rect = mapRect(map);
  const left = Math.max(box.x, rect.x);
  const top = Math.max(box.y, rect.y);
  const right = Math.min(box.x + box.width, rect.x + rect.width);
  const bottom = Math.min(box.y + box.height, rect.y + rect.height);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function pixelOffset(bounds: IRect, position: Vector2d, map: MapBounds) {
  const rect = mapRect(map);
  // Strokes may stick out of the map, so a side that does not fit is not kept on it.
  const offset = (
    from: number,
    to: number,
    length: number,
    start: number,
    mapLength: number,
  ) =>
    length > mapLength
      ? to - from
      : clamp(to - from, start - from, start + mapLength - from - length);
  return {
    dx: offset(bounds.x, position.x, bounds.width, rect.x, rect.width),
    dy: offset(bounds.y, position.y, bounds.height, rect.y, rect.height),
  };
}

export function cellOffset(area: IRect, position: Vector2d, map: MapBounds) {
  const rect = mapRect(map);
  const offset = (
    from: number,
    to: number,
    length: number,
    start: number,
    end: number,
  ) =>
    clamp(
      Math.round((to - from) / CELL_SIZE),
      Math.ceil((start - from) / CELL_SIZE),
      Math.floor((end - from - length) / CELL_SIZE),
    );
  return {
    dx: offset(area.x, position.x, area.width, rect.x, rect.x + rect.width),
    dy: offset(area.y, position.y, area.height, rect.y, rect.y + rect.height),
  };
}
