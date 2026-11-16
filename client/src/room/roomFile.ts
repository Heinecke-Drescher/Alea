import type { Vector2d } from "konva/lib/types";
import { nanoid } from "nanoid";
import { MAX_ROOM_BYTES } from "../../../shared/roomLimits";
import { BACKGROUND_IMAGE_ID } from "./background";
import {
  isOverFog,
  newStroke,
  strokeData,
  validCell,
  validStroke,
  validStrokeData,
} from "./drawing";
import { isStatusEffect } from "./effects";
import { isValidMark, MAX_MARKS, type Mark } from "./marks";
import {
  containsCell,
  containsSquare,
  DEFAULT_MAP_BOUNDS,
  validMapBounds,
  isTokenSize,
  type MapBounds,
} from "./grid";
import { BOUNDS_KEY, mapBounds } from "./map";
import {
  MAP_IMAGE_KEY,
  MAP_IMAGE_PLACE_KEY,
  validMapImage,
  validMapImagePlace,
  type MapImage,
} from "./mapImage";
import {
  cellKey,
  type Cell,
  type MapTextData,
  type RoomStore,
  type StrokeData,
  type TokenData,
  validValues,
} from "./roomStore";
import {
  megabytes,
  ROOM_SPACE_BYTES,
  RoomSpaceError,
  storedBytesAfter,
} from "./roomSpace";
import { textData, validMapText } from "./texts";
import { embeddedImage, newToken, tokenData, validToken } from "./tokens";
import { isRecord } from "./typeGuards";

const APP = "alea";
const VERSION = 1;
// Only guards against huge files chosen by mistake. The JSON text of cells and strokes is larger
// than their binary form in the room, so whether a map fits is measured on the room itself.
export const MAX_MAP_FILE_BYTES = 2 * MAX_ROOM_BYTES;
export const LOADED_MAP_KEY = "id";

export interface MapFile {
  app: typeof APP;
  version: typeof VERSION;
  bounds: MapBounds;
  cells: Cell[];
  strokes: StrokeData[];
  tokens: TokenData[];
  background: string | null;
  mapImage: MapImage | null;
  fog: Vector2d[];
  texts: MapTextData[];
}

function invalid(what: string): never {
  throw new Error(`This is not a valid map file (${what}).`);
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
  return validStrokeData(value) ?? invalid("stroke");
}

function parseMapImage(value: unknown): MapImage {
  if (!isRecord(value)) invalid("map image");
  return {
    image: image(value.image, "map image"),
    place: validMapImagePlace(value.place) ?? invalid("map image place"),
  };
}

function parseToken(value: unknown, bounds: MapBounds): TokenData {
  if (!isRecord(value)) invalid("token");
  const { x, y } = cellOnMap(value, bounds, "token");
  const { size } = value;
  if (!isTokenSize(size)) invalid("token size");
  if (!containsSquare(bounds, { x, y, size })) invalid("token off the map");
  const effects = list(value.effects, "token effects");
  if (!effects.every(isStatusEffect)) invalid("token effects");
  return {
    name: text(value.name, "token name"),
    x,
    y,
    size,
    effects,
    marks: parseMarks(value.marks),
    image: image(value.image, "token image"),
  };
}

function parseMarks(value: unknown): Mark[] {
  const marks = list(value, "token marks");
  if (marks.length > MAX_MARKS) invalid("token marks");
  return marks.map((mark) =>
    isValidMark(mark)
      ? { text: mark.text, icon: mark.icon, color: mark.color }
      : invalid("token mark"),
  );
}

// Checked before reading, so a huge file chosen by mistake is never loaded.
export function checkMapFileSize(bytes: number) {
  if (bytes > MAX_MAP_FILE_BYTES) {
    invalid(`larger than ${megabytes(MAX_MAP_FILE_BYTES)} MB`);
  }
}

export function parseMapFile(json: string): MapFile {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    invalid("no JSON");
  }
  return parseMap(value);
}

export function parseMap(value: unknown): MapFile {
  if (!isRecord(value) || value.app !== APP) invalid("not made by Alea");
  if (value.version !== VERSION) invalid(`unknown version ${value.version}`);
  const map = validMapBounds(value.bounds) ?? invalid("map size");
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
    mapImage: value.mapImage === null ? null : parseMapImage(value.mapImage),
    fog: list(value.fog, "fog").map((cell) => cellOnMap(cell, map, "fog")),
    texts: list(value.texts, "texts").map(parseText),
  };
}

function parseText(value: unknown): MapTextData {
  const text = validMapText(isRecord(value) ? { ...value, id: "file" } : null);
  if (!text) invalid("text");
  return textData(text);
}

export function emptyMap(): MapFile {
  return {
    app: APP,
    version: VERSION,
    bounds: DEFAULT_MAP_BOUNDS,
    cells: [],
    strokes: [],
    tokens: [],
    background: null,
    mapImage: null,
    fog: [],
    texts: [],
  };
}

export function writeMap(
  {
    doc,
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
    textsMap,
    fogMap,
    settingsMap,
    mapImageMap,
    loadedMapMap,
  }: RoomStore,
  file: MapFile,
) {
  doc.transact(() => {
    loadedMapMap.set(LOADED_MAP_KEY, nanoid());
    cellsMap.clear();
    strokesMap.clear();
    tokensMap.clear();
    imagesMap.clear();
    fogMap.clear();
    textsMap.clear();
    settingsMap.set(BOUNDS_KEY, file.bounds);
    mapImageMap.clear();
    for (const cell of file.cells) cellsMap.set(cellKey(cell.x, cell.y), cell);
    for (const stroke of file.strokes) {
      strokesMap.set(...newStroke(stroke, isOverFog(stroke)));
    }
    for (const data of file.tokens) {
      const { token, image } = newToken(data);
      imagesMap.set(token.imageId, image);
      tokensMap.set(token.id, token);
    }
    if (file.background) imagesMap.set(BACKGROUND_IMAGE_ID, file.background);
    if (file.mapImage) {
      imagesMap.set(MAP_IMAGE_KEY, file.mapImage.image);
      mapImageMap.set(MAP_IMAGE_PLACE_KEY, file.mapImage.place);
    }
    for (const { x, y } of file.fog) fogMap.set(cellKey(x, y), { x, y });
    for (const text of file.texts) {
      const id = nanoid();
      textsMap.set(id, { ...text, id });
    }
  });
}

export function exportMap(store: RoomStore): MapFile {
  const {
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
    textsMap,
    fogMap,
    mapImageMap,
  } = store;
  const mapImage = validMapImage(
    imagesMap.get(MAP_IMAGE_KEY),
    mapImageMap.get(MAP_IMAGE_PLACE_KEY),
  );
  const texts = Array.from(textsMap.values()).flatMap((value) => {
    const text = validMapText(value);
    return text ? [textData(text)] : [];
  });
  return {
    app: APP,
    version: VERSION,
    bounds: mapBounds(store),
    cells: validValues(cellsMap.entries(), validCell),
    strokes: validValues(strokesMap.entries(), validStroke).map((stroke) =>
      strokeData(stroke, isOverFog(stroke)),
    ),
    tokens: validValues(tokensMap.entries(), validToken).flatMap((token) => {
      const image = embeddedImage(imagesMap.get(token.imageId));
      return image ? [tokenData(token, image)] : [];
    }),
    background: embeddedImage(imagesMap.get(BACKGROUND_IMAGE_ID)),
    mapImage,
    fog: Array.from(fogMap.values(), ({ x, y }) => ({ x, y })),
    texts,
  };
}

export function createMapFiles(store: RoomStore) {
  const { doc, undoManager } = store;

  function assertSpaceForMap(file: MapFile) {
    const bytes = storedBytesAfter(doc, (copy) => writeMap(copy, file));
    if (bytes <= ROOM_SPACE_BYTES) return;
    throw new RoomSpaceError(
      `With this map the room would need ${megabytes(bytes)} MB, but it can hold at most ${megabytes(ROOM_SPACE_BYTES)} MB. Use smaller or fewer images.`,
    );
  }

  // One undo step, so undo brings back the whole map as it was before.
  function importMap(file: MapFile) {
    assertSpaceForMap(file);
    undoManager.stopCapturing();
    writeMap(store, file);
    undoManager.stopCapturing();
  }

  return {
    exportMap: () => exportMap(store),
    importMap,
    assertSpaceForMap,
  };
}
