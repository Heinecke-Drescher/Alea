import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";
import { CELL_SIZE, mapRect, type MapBounds } from "./grid";

export type Selection =
  | { kind: "none" }
  | { kind: "area"; area: IRect }
  | { kind: "strokes"; ids: string[] };

export const NO_SELECTION: Selection = { kind: "none" };

export function areaSelection(area: IRect | null): Selection {
  return area ? { kind: "area", area } : NO_SELECTION;
}

export function strokesSelection(ids: string[]): Selection {
  return ids.length > 0 ? { kind: "strokes", ids } : NO_SELECTION;
}

export function selectedArea(selection: Selection) {
  return selection.kind === "area" ? selection.area : null;
}

export function selectedStrokeIds(selection: Selection) {
  return selection.kind === "strokes" ? selection.ids : [];
}

export function withPressedStroke(
  selection: Selection,
  id: string,
  isAdding: boolean,
): Selection {
  const ids = selectedStrokeIds(selection);
  if (ids.includes(id)) return selection;
  return strokesSelection(isAdding ? [...ids, id] : [id]);
}

export function withoutStroke(selection: Selection, id: string): Selection {
  return strokesSelection(
    selectedStrokeIds(selection).filter((other) => other !== id),
  );
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
