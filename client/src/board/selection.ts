import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";
import { CELL_SIZE, MAP_HEIGHT, MAP_WIDTH } from "./grid";

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

export function clipToMap(box: IRect): IRect | null {
  const left = Math.max(box.x, 0);
  const top = Math.max(box.y, 0);
  const right = Math.min(box.x + box.width, MAP_WIDTH);
  const bottom = Math.min(box.y + box.height, MAP_HEIGHT);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function pixelOffset(bounds: IRect, position: Vector2d) {
  return {
    dx: clamp(
      position.x - bounds.x,
      -bounds.x,
      MAP_WIDTH - bounds.x - bounds.width,
    ),
    dy: clamp(
      position.y - bounds.y,
      -bounds.y,
      MAP_HEIGHT - bounds.y - bounds.height,
    ),
  };
}

export function cellOffset(area: IRect, position: Vector2d) {
  const offset = (from: number, to: number, size: number, mapSize: number) =>
    clamp(
      Math.round((to - from) / CELL_SIZE),
      Math.ceil(-from / CELL_SIZE),
      Math.floor((mapSize - from - size) / CELL_SIZE),
    );
  return {
    dx: offset(area.x, position.x, area.width, MAP_WIDTH),
    dy: offset(area.y, position.y, area.height, MAP_HEIGHT),
  };
}
