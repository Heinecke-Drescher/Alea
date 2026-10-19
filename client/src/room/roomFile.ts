import type { Vector2d } from "konva/lib/types";
import { nanoid } from "nanoid";
import { BACKGROUND_IMAGE_ID } from "./background";
import { isOverFog, newStroke, strokeData } from "./drawing";
import { isStatusEffect, tokenEffects, type StatusEffect } from "./effects";
import {
  containsCell,
  containsSquare,
  isValidMapBounds,
  MAX_TOKEN_SIZE,
  type MapBounds,
} from "./grid";
import { BOUNDS_KEY, type MapActions } from "./map";
import {
  cellKey,
  type Cell,
  type RoomStore,
  type StrokeData,
} from "./roomStore";
import { embeddedImage } from "./tokens";

const APP = "alea";
const VERSION = 1;
// The server saves at most this much per room.
export const MAX_MAP_FILE_BYTES = 5 * 1024 ** 2;

export interface MapFile {
  app: typeof APP;
  version: typeof VERSION;
  bounds: MapBounds;
  cells: Cell[];
  strokes: StrokeData[];
  tokens: {
    name: string;
    x: number;
    y: number;
    size: number;
    effects: StatusEffect[];
    image: string;
  }[];
  background: string | null;
  fog: Vector2d[];
}

function invalid(what: string): never {
  throw new Error(`This is not a valid map file (${what}).`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function list(value: unknown, what: string) {
  if (!Array.isArray(value)) invalid(what);
  return value as unknown[];
}

function integer(value: unknown, what: string) {
  if (!Number.isInteger(value)) invalid(what);
  return value as number;
}

function text(value: unknown, what: string) {
  if (typeof value !== "string") invalid(what);
  return value;
}

function image(value: unknown, what: string) {
  const dataUrl = embeddedImage(typeof value === "string" ? value : undefined);
  if (!dataUrl) invalid(what);
  return dataUrl;
}

function cellOnMap(value: unknown, bounds: MapBounds, what: string) {
  if (!isRecord(value)) invalid(what);
  const x = integer(value.x, what);
  const y = integer(value.y, what);
  if (!containsCell(bounds, x, y)) invalid(`${what} off the map`);
  return { x, y };
}

function parseStroke(value: unknown): StrokeData {
  if (!isRecord(value)) invalid("stroke");
  const color = text(value.color, "stroke color");
  const points = list(value.points, "stroke points");
  const isPointList = points.length >= 4 && points.length % 2 === 0;
  if (!isPointList || !points.every(Number.isFinite)) invalid("stroke points");
  if (value.overFog !== undefined && value.overFog !== true) {
    invalid("stroke above the fog");
  }
  return value.overFog === true
    ? { color, points: points as number[], overFog: true as const }
    : { color, points: points as number[] };
}

function parseToken(value: unknown, bounds: MapBounds) {
  if (!isRecord(value)) invalid("token");
  const { x, y } = cellOnMap(value, bounds, "token");
  const size = integer(value.size, "token size");
  if (size < 1 || size > MAX_TOKEN_SIZE) invalid("token size");
  if (!containsSquare(bounds, { x, y, size })) invalid("token off the map");
  const effects = list(value.effects, "token effects");
  if (!effects.every(isStatusEffect)) invalid("token effects");
  return {
    name: text(value.name, "token name"),
    x,
    y,
    size,
    effects,
    image: image(value.image, "token image"),
  };
}

export function parseMapFile(json: string): MapFile {
  if (json.length > MAX_MAP_FILE_BYTES) invalid("larger than 5 MB");
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    invalid("no JSON");
  }
  if (!isRecord(value) || value.app !== APP) invalid("not made by Alea");
  if (value.version !== VERSION) invalid(`unknown version ${value.version}`);
  const { bounds } = value;
  if (!isRecord(bounds) || !isValidMapBounds(bounds as unknown as MapBounds)) {
    invalid("map size");
  }
  const map = bounds as unknown as MapBounds;
  return {
    app: APP,
    version: VERSION,
    bounds: map,
    cells: list(value.cells, "cells").map((cell) => ({
      ...cellOnMap(cell, map, "cell"),
      color: text(isRecord(cell) ? cell.color : undefined, "cell color"),
    })),
    strokes: list(value.strokes, "strokes").map(parseStroke),
    tokens: list(value.tokens, "tokens").map((token) => parseToken(token, map)),
    background:
      value.background === null ? null : image(value.background, "background"),
    fog: list(value.fog, "fog").map((cell) => cellOnMap(cell, map, "fog")),
  };
}

export function createMapFiles(
  {
    doc,
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
    fogMap,
    settingsMap,
    undoManager,
  }: RoomStore,
  { mapBounds }: MapActions,
) {
  function exportMap(): MapFile {
    return {
      app: APP,
      version: VERSION,
      bounds: mapBounds(),
      cells: Array.from(cellsMap.values(), ({ x, y, color }) => ({
        x,
        y,
        color,
      })),
      strokes: Array.from(strokesMap.values(), (stroke) =>
        strokeData(stroke, isOverFog(stroke)),
      ),
      tokens: Array.from(tokensMap.values()).flatMap((token) => {
        const tokenImage = embeddedImage(imagesMap.get(token.imageId));
        if (!tokenImage) return [];
        const { name, x, y, size } = token;
        return [
          { name, x, y, size, effects: tokenEffects(token), image: tokenImage },
        ];
      }),
      background: embeddedImage(imagesMap.get(BACKGROUND_IMAGE_ID)),
      fog: Array.from(fogMap.values(), ({ x, y }) => ({ x, y })),
    };
  }

  // One undo step, so undo brings back the whole map as it was before.
  function importMap(file: MapFile) {
    undoManager.stopCapturing();
    doc.transact(() => {
      cellsMap.clear();
      strokesMap.clear();
      tokensMap.clear();
      imagesMap.clear();
      fogMap.clear();
      settingsMap.set(BOUNDS_KEY, file.bounds);
      for (const cell of file.cells)
        cellsMap.set(cellKey(cell.x, cell.y), cell);
      for (const stroke of file.strokes) {
        strokesMap.set(...newStroke(stroke, isOverFog(stroke)));
      }
      for (const { image: tokenImage, effects, ...token } of file.tokens) {
        const id = nanoid();
        const imageId = nanoid();
        imagesMap.set(imageId, tokenImage);
        tokensMap.set(id, {
          ...token,
          id,
          imageId,
          ...(effects.length > 0 && { effects }),
        });
      }
      if (file.background) imagesMap.set(BACKGROUND_IMAGE_ID, file.background);
      for (const { x, y } of file.fog) fogMap.set(cellKey(x, y), { x, y });
    });
    undoManager.stopCapturing();
  }

  return { exportMap, importMap };
}
