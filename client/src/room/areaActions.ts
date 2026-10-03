import { nanoid } from "nanoid";
import { CELL_SIZE, squareCenter } from "./grid";
import { putCell, shiftPoints } from "./drawing";
import { placeToken, type MapActions } from "./map";
import { cellKey, type Cell, type RoomStore } from "./roomStore";
import { strokeTouches, type Area } from "./strokeTouches";

export interface Clip {
  cells: Cell[];
  tokens: { name: string; image: string; x: number; y: number; size: number }[];
  strokes: { color: string; points: number[] }[];
}

function hasCenterIn(area: Area, x: number, y: number, size: number) {
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

  function moveArea(area: Area, dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    undoManager.stopCapturing();
    doc.transact(() => {
      moveCellsIn(area, dx, dy);
      moveTokensIn(area, dx, dy);
      moveStrokesIn(area, dx, dy);
    });
  }

  function moveCellsIn(area: Area, dx: number, dy: number) {
    const moved = cellsIn(area);
    for (const cell of moved) cellsMap.delete(cellKey(cell.x, cell.y));
    for (const cell of moved) putCell(store, mapBounds(), cell, dx, dy);
  }

  function moveTokensIn(area: Area, dx: number, dy: number) {
    for (const token of tokensIn(area)) {
      tokensMap.set(token.id, {
        ...token,
        ...placeToken(mapBounds(), token, dx, dy),
      });
    }
  }

  function moveStrokesIn(area: Area, dx: number, dy: number) {
    for (const stroke of strokesIn(area)) {
      strokesMap.set(stroke.id, {
        ...stroke,
        points: shiftPoints(stroke.points, dx * CELL_SIZE, dy * CELL_SIZE),
      });
    }
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

  function copyArea(area: Area): Clip {
    return {
      cells: cellsIn(area),
      tokens: tokensIn(area).flatMap(({ name, imageId, x, y, size }) => {
        const image = imagesMap.get(imageId);
        return image ? [{ name, image, x, y, size }] : [];
      }),
      strokes: strokesIn(area).map(({ color, points }) => ({ color, points })),
    };
  }

  function copyStrokes(ids: string[]): Clip {
    return {
      cells: [],
      tokens: [],
      strokes: ids.flatMap((id) => {
        const stroke = strokesMap.get(id);
        return stroke ? [{ color: stroke.color, points: stroke.points }] : [];
      }),
    };
  }

  function paste(clip: Clip, dx: number, dy: number) {
    const hasGridContent = clip.cells.length > 0 || clip.tokens.length > 0;
    const isWholeCells =
      Number.isInteger(dx / CELL_SIZE) && Number.isInteger(dy / CELL_SIZE);
    if (hasGridContent && !isWholeCells) {
      throw new Error("Cells and tokens can only be pasted in whole cells");
    }
    undoManager.stopCapturing();
    const strokeIds: string[] = [];
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
      }
      for (const { color, points } of clip.strokes) {
        const id = nanoid();
        strokeIds.push(id);
        strokesMap.set(id, { id, color, points: shiftPoints(points, dx, dy) });
      }
    });
    return strokeIds;
  }

  function deleteArea(area: Area) {
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const cell of cellsIn(area)) {
        cellsMap.delete(cellKey(cell.x, cell.y));
      }
      for (const token of tokensIn(area)) {
        tokensMap.delete(token.id);
        imagesMap.delete(token.imageId);
      }
      for (const stroke of strokesIn(area)) strokesMap.delete(stroke.id);
    });
  }

  return { moveArea, copyArea, copyStrokes, paste, deleteArea };
}
