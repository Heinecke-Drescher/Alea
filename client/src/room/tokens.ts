import { nanoid } from "nanoid";
import { placeToken, type MapActions } from "./map";
import { cellKey, type RoomStore, type Token } from "./roomStore";

export function embeddedImage(value: string | undefined) {
  return value?.startsWith("data:image/") ? value : null;
}

function coveredCells(token: Token): string[] {
  const cells: string[] = [];
  for (let dy = 0; dy < token.size; dy++) {
    for (let dx = 0; dx < token.size; dx++) {
      cells.push(cellKey(token.x + dx, token.y + dy));
    }
  }
  return cells;
}

export function createTokens(
  { doc, tokensMap, imagesMap, undoManager }: RoomStore,
  { mapBounds }: MapActions,
) {
  function addToken(name: string, imageDataUrl: string) {
    undoManager.stopCapturing();
    const id = nanoid();
    const imageId = nanoid();
    const { x, y } = findFreeCell();
    doc.transact(() => {
      imagesMap.set(imageId, imageDataUrl);
      tokensMap.set(id, { id, name, imageId, x, y, size: 1 });
    });
  }

  function renameToken(id: string, name: string) {
    updateToken(id, (token) => ({ ...token, name }));
  }

  function resizeToken(id: string, size: number) {
    undoManager.stopCapturing();
    updateToken(id, (token) => ({
      ...token,
      size,
      ...placeToken(mapBounds(), { ...token, size }, 0, 0),
    }));
  }

  function removeToken(id: string) {
    undoManager.stopCapturing();
    const token = tokensMap.get(id);
    if (!token) return;
    doc.transact(() => {
      tokensMap.delete(id);
      imagesMap.delete(token.imageId);
    });
  }

  function updateToken(id: string, change: (token: Token) => Token) {
    const token = tokensMap.get(id);
    if (!token) return;
    tokensMap.set(id, change(token));
  }

  function findFreeCell() {
    const occupied = new Set(
      Array.from(tokensMap.values(), coveredCells).flat(),
    );
    const { x: left, y: top, columns, rows } = mapBounds();
    for (let y = top; y < top + rows; y++) {
      for (let x = left; x < left + columns; x++) {
        if (!occupied.has(cellKey(x, y))) return { x, y };
      }
    }
    throw new Error("No free cell left on the map");
  }

  return { addToken, renameToken, resizeToken, removeToken };
}
