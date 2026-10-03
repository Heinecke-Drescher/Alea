import { nanoid } from "nanoid";
import { CELL_SIZE, squareCenter } from "./grid";
import { putCell, shiftPoints } from "./drawing";
import { placeToken, type MapActions } from "./map";
import type * as Y from "yjs";
import {
  cellKey,
  type Cell,
  type RoomStore,
  type Stroke,
  type Token,
} from "./roomStore";
import { strokeTouches, type Area } from "./strokeTouches";

export interface Clip {
  cells: Cell[];
  tokens: { name: string; image: string; x: number; y: number; size: number }[];
  strokes: { color: string; points: number[] }[];
}

export type ItemType = "strokes" | "tokens";

export type Items = Record<ItemType, string[]>;

interface Content {
  cells: Cell[];
  tokens: Token[];
  strokes: Stroke[];
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

export function hasCenterIn(area: Area, x: number, y: number, size: number) {
  const center = squareCenter(x, y, size);
  return (
    center.x >= area.x &&
    center.x <= area.x + area.width &&
    center.y >= area.y &&
    center.y <= area.y + area.height
  );
}

export function createAreaActions(store: RoomStore, { mapBounds }: MapActions) {
  const { doc, tokensMap, imagesMap, cellsMap, strokesMap, undoManager } =
    store;

  function move({ cells, tokens, strokes }: Content, dx: number, dy: number) {
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
          points: shiftPoints(stroke.points, dx, dy),
        });
      }
    });
  }

  function moveArea(area: Area, dx: number, dy: number) {
    move(contentIn(area), dx * CELL_SIZE, dy * CELL_SIZE);
  }

  function moveItems(items: Items, dx: number, dy: number) {
    const content = contentOf(items);
    if (hasGridContent(content) && !isWholeCells(dx, dy)) {
      throw new Error("Tokens can only be moved in whole cells");
    }
    move(content, dx, dy);
  }

  function cellsIn(area: Area) {
    return Array.from(cellsMap.values()).filter((cell) =>
      hasCenterIn(area, cell.x, cell.y, 1),
    );
  }

  function tokensIn(area: Area) {
    return Array.from(tokensMap.values()).filter((token) =>
      hasCenterIn(area, token.x, token.y, token.size),
    );
  }

  function strokesIn(area: Area) {
    return Array.from(strokesMap.values()).filter((stroke) =>
      strokeTouches(stroke.points, area),
    );
  }

  function contentIn(area: Area): Content {
    return {
      cells: cellsIn(area),
      tokens: tokensIn(area),
      strokes: strokesIn(area),
    };
  }

  function contentOf(items: Items): Content {
    return {
      cells: [],
      tokens: existing(tokensMap, items.tokens),
      strokes: existing(strokesMap, items.strokes),
    };
  }

  function copy({ cells, tokens, strokes }: Content): Clip {
    return {
      cells,
      tokens: tokens.flatMap(({ name, imageId, x, y, size }) => {
        const image = imagesMap.get(imageId);
        return image ? [{ name, image, x, y, size }] : [];
      }),
      strokes: strokes.map(({ color, points }) => ({ color, points })),
    };
  }

  function copyArea(area: Area) {
    return copy(contentIn(area));
  }

  function copyItems(items: Items) {
    return copy(contentOf(items));
  }

  function paste(clip: Clip, dx: number, dy: number) {
    if (hasGridContent(clip) && !isWholeCells(dx, dy)) {
      throw new Error("Cells and tokens can only be pasted in whole cells");
    }
    undoManager.stopCapturing();
    const pasted: Items = { strokes: [], tokens: [] };
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
      for (const { color, points } of clip.strokes) {
        const id = nanoid();
        pasted.strokes.push(id);
        strokesMap.set(id, { id, color, points: shiftPoints(points, dx, dy) });
      }
    });
    return pasted;
  }

  function remove({ cells, tokens, strokes }: Content) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const cell of cells) cellsMap.delete(cellKey(cell.x, cell.y));
      for (const token of tokens) {
        tokensMap.delete(token.id);
        imagesMap.delete(token.imageId);
      }
      for (const stroke of strokes) strokesMap.delete(stroke.id);
    });
  }

  function deleteArea(area: Area) {
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
    deleteArea,
    deleteItems,
  };
}
