import type { IRect } from "konva/lib/types";
import { nanoid } from "nanoid";
import { tokenEffects, type StatusEffect } from "./effects";
import {
  CELL_SIZE,
  nearestFreeSquare,
  squareCenter,
  type Square,
} from "./grid";
import {
  isOverFog,
  newStroke,
  putCell,
  shiftStroke,
  strokeData,
} from "./drawing";
import { placeToken, type MapActions } from "./map";
import type * as Y from "yjs";
import {
  cellKey,
  type Cell,
  type MapText,
  type MapTextData,
  type RoomStore,
  type Stroke,
  type StrokeData,
  type Token,
} from "./roomStore";
import { assertSpace } from "./roomSpace";
import { strokeTouches } from "./strokeTouches";
import { textData, textTouches, validMapText } from "./texts";

export interface Clip {
  cells: Cell[];
  tokens: {
    name: string;
    image: string;
    x: number;
    y: number;
    size: number;
    effects: StatusEffect[];
  }[];
  strokes: StrokeData[];
  texts: MapTextData[];
}

export type ItemType = "strokes" | "tokens" | "texts";

export type Items = Record<ItemType, string[]>;

export const NO_ITEMS: Items = { strokes: [], tokens: [], texts: [] };

interface Content {
  cells: Cell[];
  tokens: Token[];
  strokes: Stroke[];
  texts: MapText[];
}

export function hasGridContent({ cells, tokens }: Clip | Content) {
  return cells.length > 0 || tokens.length > 0;
}

function isWholeCells(dx: number, dy: number) {
  return Number.isInteger(dx / CELL_SIZE) && Number.isInteger(dy / CELL_SIZE);
}

export function existing<T>(map: Y.Map<T>, ids: string[]) {
  return ids.flatMap((id) => {
    const value = map.get(id);
    return value ? [value] : [];
  });
}

// Texts come from other players, so only their known fields are moved, copied or kept.
function validTexts(values: unknown[]) {
  return values.flatMap((value) => validMapText(value) ?? []);
}

export function hasCenterIn(area: IRect, x: number, y: number, size: number) {
  const center = squareCenter(x, y, size);
  return (
    center.x >= area.x &&
    center.x <= area.x + area.width &&
    center.y >= area.y &&
    center.y <= area.y + area.height
  );
}

export function createAreaActions(store: RoomStore, { mapBounds }: MapActions) {
  const {
    doc,
    tokensMap,
    imagesMap,
    cellsMap,
    strokesMap,
    textsMap,
    undoManager,
  } = store;

  function move(
    { cells, tokens, strokes, texts }: Content,
    dx: number,
    dy: number,
  ) {
    if (dx === 0 && dy === 0) return;
    const columns = dx / CELL_SIZE;
    const rows = dy / CELL_SIZE;
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const cell of cells) cellsMap.delete(cellKey(cell.x, cell.y));
      for (const cell of cells)
        putCell(store, mapBounds(), cell, columns, rows);
      for (const token of tokens) {
        tokensMap.set(token.id, {
          ...token,
          ...placeToken(mapBounds(), token, columns, rows),
        });
      }
      for (const stroke of strokes) {
        strokesMap.set(stroke.id, {
          ...stroke,
          ...shiftStroke(stroke, dx, dy),
        });
      }
      for (const text of texts) {
        textsMap.set(text.id, { ...text, x: text.x + dx, y: text.y + dy });
      }
    });
  }

  function moveArea(area: IRect, dx: number, dy: number) {
    move(contentIn(area), dx * CELL_SIZE, dy * CELL_SIZE);
  }

  function moveItems(items: Items, dx: number, dy: number) {
    const content = contentOf(items);
    if (hasGridContent(content) && !isWholeCells(dx, dy)) {
      throw new Error("Tokens can only be moved in whole cells");
    }
    move(content, dx, dy);
  }

  function cellsIn(area: IRect) {
    return Array.from(cellsMap.values()).filter((cell) =>
      hasCenterIn(area, cell.x, cell.y, 1),
    );
  }

  function tokensIn(area: IRect) {
    return Array.from(tokensMap.values()).filter((token) =>
      hasCenterIn(area, token.x, token.y, token.size),
    );
  }

  function strokesIn(area: IRect) {
    return Array.from(strokesMap.values()).filter((stroke) =>
      strokeTouches(stroke, area),
    );
  }

  function textsIn(area: IRect) {
    return validTexts(Array.from(textsMap.values())).filter((text) =>
      textTouches(text, area),
    );
  }

  function contentIn(area: IRect): Content {
    return {
      cells: cellsIn(area),
      tokens: tokensIn(area),
      strokes: strokesIn(area),
      texts: textsIn(area),
    };
  }

  function contentOf(items: Items): Content {
    return {
      cells: [],
      tokens: existing(tokensMap, items.tokens),
      strokes: existing(strokesMap, items.strokes),
      texts: validTexts(existing(textsMap, items.texts)),
    };
  }

  function copy({ cells, tokens, strokes, texts }: Content): Clip {
    return {
      cells,
      tokens: tokens.flatMap((token) => {
        const { name, imageId, x, y, size } = token;
        const image = imagesMap.get(imageId);
        return image
          ? [{ name, image, x, y, size, effects: tokenEffects(token) }]
          : [];
      }),
      strokes: strokes.map((stroke) => strokeData(stroke, isOverFog(stroke))),
      texts: texts.map(textData),
    };
  }

  function copyArea(area: IRect) {
    return copy(contentIn(area));
  }

  function copyItems(items: Items) {
    return copy(contentOf(items));
  }

  function paste(clip: Clip, dx: number, dy: number, overFog = false) {
    if (hasGridContent(clip) && !isWholeCells(dx, dy)) {
      throw new Error("Cells and tokens can only be pasted in whole cells");
    }
    if (clip.tokens.length > 0) {
      const imageBytes = clip.tokens.reduce(
        (sum, token) => sum + token.image.length,
        0,
      );
      assertSpace(doc, imageBytes, "the copied tokens");
    }
    undoManager.stopCapturing();
    const pasted: Items = { strokes: [], tokens: [], texts: [] };
    doc.transact(() => {
      for (const cell of clip.cells) {
        putCell(store, mapBounds(), cell, dx / CELL_SIZE, dy / CELL_SIZE);
      }
      for (const { image, ...token } of clip.tokens) {
        const id = nanoid();
        const imageId = nanoid();
        const position = placeToken(
          mapBounds(),
          token,
          dx / CELL_SIZE,
          dy / CELL_SIZE,
        );
        imagesMap.set(imageId, image);
        tokensMap.set(id, { ...token, ...position, id, imageId });
        pasted.tokens.push(id);
      }
      for (const data of clip.strokes) {
        const [id, stroke] = newStroke(
          { ...data, ...shiftStroke(data, dx, dy) },
          overFog,
        );
        pasted.strokes.push(id);
        strokesMap.set(id, stroke);
      }
      for (const { text, x, y, width, height, color, fontSize } of clip.texts) {
        const id = nanoid();
        textsMap.set(id, {
          id,
          text,
          x: x + dx,
          y: y + dy,
          width,
          height,
          color,
          ...(fontSize !== undefined && { fontSize }),
          ...(overFog && { overFog: true }),
        });
        pasted.texts.push(id);
      }
    });
    return pasted;
  }

  function duplicateToken(id: string, blocked: Square[] = []) {
    const token = tokensMap.get(id);
    if (!token) return;
    const cell = nearestFreeSquare(
      token,
      [...tokensMap.values(), ...blocked],
      mapBounds(),
    );
    if (!cell) return;
    const [copyId] = paste(
      copyItems({ ...NO_ITEMS, tokens: [id] }),
      (cell.x - token.x) * CELL_SIZE,
      (cell.y - token.y) * CELL_SIZE,
    ).tokens;
    return copyId;
  }

  function remove({ cells, tokens, strokes, texts }: Content) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const cell of cells) cellsMap.delete(cellKey(cell.x, cell.y));
      for (const token of tokens) {
        tokensMap.delete(token.id);
        imagesMap.delete(token.imageId);
      }
      for (const stroke of strokes) strokesMap.delete(stroke.id);
      for (const text of texts) textsMap.delete(text.id);
    });
  }

  function deleteArea(area: IRect) {
    remove(contentIn(area));
  }

  function deleteItems(items: Items) {
    remove(contentOf(items));
  }

  return {
    moveArea,
    moveItems,
    copyArea,
    copyItems,
    paste,
    duplicateToken,
    deleteArea,
    deleteItems,
  };
}
