import type { IRect } from "konva/lib/types";
import { nanoid } from "nanoid";
import { CELL_SIZE, nearestFreeSquare, placeToken, type Square } from "./grid";
import {
  isOverFog,
  newStroke,
  putCell,
  shiftStroke,
  strokeData,
  validCell,
  validStroke,
} from "./drawing";
import type { MapActions } from "./map";
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
  type TokenData,
  validValues,
} from "./roomStore";
import { assertSpace } from "./roomSpace";
import {
  byListOrder,
  embeddedImage,
  endOfList,
  newToken,
  tokenData,
  validToken,
} from "./tokens";
import { strokeTouches } from "./strokeTouches";
import { textData, textTouches, validMapText } from "./texts";

export interface Clip {
  cells: Cell[];
  tokens: TokenData[];
  strokes: StrokeData[];
  texts: MapTextData[];
}

export type ItemType = "strokes" | "tokens" | "texts";

export type Items = Record<ItemType, readonly string[]>;

export const NO_ITEMS: Items = { strokes: [], tokens: [], texts: [] };

export function oneItem(type: ItemType, id: string): Items {
  return { ...NO_ITEMS, [type]: [id] };
}

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

export function existing<V, T>(
  map: Y.Map<V>,
  ids: readonly string[],
  valid: (id: string, value: V | undefined) => T | null,
) {
  return validValues(
    ids.map((id) => [id, map.get(id)]),
    valid,
  );
}

// How far the area has to reach into a cell or token, so that only grazing it does not count.
const TOUCH_BUFFER = 10;

export function isTouchedBy(area: IRect, x: number, y: number, size: number) {
  const left = x * CELL_SIZE + TOUCH_BUFFER;
  const top = y * CELL_SIZE + TOUCH_BUFFER;
  const right = (x + size) * CELL_SIZE - TOUCH_BUFFER;
  const bottom = (y + size) * CELL_SIZE - TOUCH_BUFFER;
  return (
    area.x < right &&
    area.x + area.width > left &&
    area.y < bottom &&
    area.y + area.height > top
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

  function contentIn(area: IRect): Content {
    return {
      cells: validValues(cellsMap.entries(), validCell).filter((cell) =>
        isTouchedBy(area, cell.x, cell.y, 1),
      ),
      tokens: validValues(tokensMap.entries(), validToken).filter((token) =>
        isTouchedBy(area, token.x, token.y, token.size),
      ),
      strokes: validValues(strokesMap.entries(), validStroke).filter((stroke) =>
        strokeTouches(stroke, area),
      ),
      texts: validValues(textsMap.entries(), (_, text) =>
        validMapText(text),
      ).filter((text) => textTouches(text, area)),
    };
  }

  function contentOf(items: Items): Content {
    return {
      cells: [],
      tokens: existing(tokensMap, items.tokens, validToken),
      strokes: existing(strokesMap, items.strokes, validStroke),
      texts: existing(textsMap, items.texts, (_, text) => validMapText(text)),
    };
  }

  function copy({ cells, tokens, strokes, texts }: Content): Clip {
    return {
      cells,
      tokens: [...tokens].sort(byListOrder).flatMap((token) => {
        const image = embeddedImage(imagesMap.get(token.imageId));
        return image ? [tokenData(token, image)] : [];
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
      assertSpace(store.meter, imageBytes, "the copied tokens");
    }
    undoManager.stopCapturing();
    const pasted: Record<ItemType, string[]> = {
      strokes: [],
      tokens: [],
      texts: [],
    };
    doc.transact(() => {
      const end = endOfList(tokensMap);
      for (const cell of clip.cells) {
        putCell(store, mapBounds(), cell, dx / CELL_SIZE, dy / CELL_SIZE);
      }
      for (const [index, data] of clip.tokens.entries()) {
        const position = placeToken(
          mapBounds(),
          data,
          dx / CELL_SIZE,
          dy / CELL_SIZE,
        );
        const { token, image } = newToken(
          { ...data, ...position },
          end + index,
        );
        imagesMap.set(token.imageId, image);
        tokensMap.set(token.id, token);
        pasted.tokens.push(token.id);
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
          fontSize,
          ...(overFog && { overFog: true }),
        });
        pasted.texts.push(id);
      }
    });
    return pasted;
  }

  function duplicateToken(id: string, blocked: Square[] = []) {
    const token = validToken(id, tokensMap.get(id));
    if (!token) return;
    const cell = nearestFreeSquare(
      token,
      [...validValues(tokensMap.entries(), validToken), ...blocked],
      mapBounds(),
    );
    if (!cell) return;
    const [copyId] = paste(
      copyItems(oneItem("tokens", id)),
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
