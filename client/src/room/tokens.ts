import { nanoid } from "nanoid";
import { tokenEffects, type StatusEffect } from "./effects";
import { MAX_TOKEN_SIZE, overlaps, type Square } from "./grid";
import { placeToken, type MapActions } from "./map";
import type { RoomStore, Token } from "./roomStore";

export function embeddedImage(value: string | undefined) {
  return value?.startsWith("data:image/") ? value : null;
}

export function createTokens(
  { doc, tokensMap, imagesMap, undoManager }: RoomStore,
  { mapBounds }: MapActions,
) {
  function addToken(
    name: string,
    imageDataUrl: string,
    cell?: { x: number; y: number },
  ) {
    undoManager.stopCapturing();
    const id = nanoid();
    const imageId = nanoid();
    const { x, y } = cell
      ? placeToken(mapBounds(), { ...cell, size: 1 }, 0, 0)
      : findFreeCell();
    doc.transact(() => {
      imagesMap.set(imageId, imageDataUrl);
      tokensMap.set(id, { id, name, imageId, x, y, size: 1 });
    });
  }

  function renameToken(id: string, name: string) {
    updateToken(id, (token) => ({ ...token, name }));
  }

  function toggleEffect(id: string, effect: StatusEffect) {
    undoManager.stopCapturing();
    updateToken(id, (token) => {
      const effects = tokenEffects(token);
      return {
        ...token,
        effects: effects.includes(effect)
          ? effects.filter((other) => other !== effect)
          : [...effects, effect],
      };
    });
  }

  function resizeToken(id: string, square: Square) {
    const { size } = square;
    if (!Number.isInteger(size) || size < 1 || size > MAX_TOKEN_SIZE) {
      throw new Error(`Invalid token size ${size}`);
    }
    undoManager.stopCapturing();
    updateToken(id, (token) => ({
      ...token,
      size,
      ...placeToken(mapBounds(), square, 0, 0),
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
    const tokens = Array.from(tokensMap.values());
    const { x: left, y: top, columns, rows } = mapBounds();
    for (let y = top; y < top + rows; y++) {
      for (let x = left; x < left + columns; x++) {
        const cell = { x, y, size: 1 };
        if (!tokens.some((token) => overlaps(cell, token))) return { x, y };
      }
    }
    throw new Error("No free cell left on the map");
  }

  return { addToken, renameToken, toggleEffect, resizeToken, removeToken };
}
