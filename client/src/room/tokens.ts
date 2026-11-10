import { nanoid } from "nanoid";
import { tokenEffects, type StatusEffect } from "./effects";
import { MAX_TOKEN_SIZE, type Square } from "./grid";
import { placeToken, type MapActions } from "./map";
import { isValidMark, MAX_MARKS, tokenMarks, type Mark } from "./marks";
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
    cell: { x: number; y: number },
  ) {
    const { x, y } = placeToken(mapBounds(), { ...cell, size: 1 }, 0, 0);
    const id = nanoid();
    const imageId = nanoid();
    undoManager.stopCapturing();
    doc.transact(() => {
      imagesMap.set(imageId, imageDataUrl);
      tokensMap.set(id, { id, name, imageId, x, y, size: 1 });
    });
  }

  function setTokenImage(id: string, imageDataUrl: string) {
    const token = tokensMap.get(id);
    if (!token) return;
    const imageId = nanoid();
    undoManager.stopCapturing();
    doc.transact(() => {
      imagesMap.set(imageId, imageDataUrl);
      tokensMap.set(id, { ...token, imageId });
      imagesMap.delete(token.imageId);
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

  function addMark(id: string, mark: Mark) {
    if (!isValidMark(mark)) throw new Error("Invalid mark");
    undoManager.stopCapturing();
    updateToken(id, (token) => {
      const marks = tokenMarks(token);
      if (marks.length >= MAX_MARKS) throw new Error("Too many marks");
      return { ...token, marks: [...marks, mark] };
    });
  }

  // Another player may have removed the mark meanwhile; then nothing changes.
  function changeMark(id: string, index: number, mark: Mark) {
    if (!isValidMark(mark)) throw new Error("Invalid mark");
    undoManager.stopCapturing();
    updateToken(id, (token) => {
      const marks = tokenMarks(token);
      if (index >= marks.length) return token;
      return {
        ...token,
        marks: marks.map((other, i) => (i === index ? mark : other)),
      };
    });
  }

  function removeMark(id: string, index: number) {
    undoManager.stopCapturing();
    updateToken(id, (token) => {
      const marks = tokenMarks(token).filter((_, i) => i !== index);
      const unmarked = { ...token };
      delete unmarked.marks;
      return marks.length > 0 ? { ...unmarked, marks } : unmarked;
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

  return {
    addToken,
    setTokenImage,
    renameToken,
    toggleEffect,
    addMark,
    changeMark,
    removeMark,
    resizeToken,
    removeToken,
  };
}
