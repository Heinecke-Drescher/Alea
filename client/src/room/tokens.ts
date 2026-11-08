import { nanoid } from "nanoid";
import { tokenEffects, type StatusEffect } from "./effects";
import { MAX_TOKEN_SIZE, overlaps, type Square } from "./grid";
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
  // Without a cell the token goes to the first free one, skipping the blocked squares.
  function addToken(
    name: string,
    imageDataUrl: string,
    cell?: { x: number; y: number },
    blocked: Square[] = [],
  ) {
    const at = cell
      ? placeToken(mapBounds(), { ...cell, size: 1 }, 0, 0)
      : findFreeCell(blocked);
    undoManager.stopCapturing();
    doc.transact(() => putToken(name, imageDataUrl, at));
  }

  // Cells are found before anything is added, so a full map adds none of them.
  function addTokens(
    tokens: { name: string; imageDataUrl: string }[],
    blocked: Square[] = [],
  ) {
    const taken = [...blocked];
    const placed = tokens.map((token) => {
      const cell = findFreeCell(taken);
      taken.push({ ...cell, size: 1 });
      return { ...token, cell };
    });
    undoManager.stopCapturing();
    doc.transact(() => {
      for (const { name, imageDataUrl, cell } of placed) {
        putToken(name, imageDataUrl, cell);
      }
    });
  }

  function putToken(
    name: string,
    imageDataUrl: string,
    { x, y }: { x: number; y: number },
  ) {
    const id = nanoid();
    const imageId = nanoid();
    imagesMap.set(imageId, imageDataUrl);
    tokensMap.set(id, { id, name, imageId, x, y, size: 1 });
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

  function findFreeCell(blocked: Square[]) {
    const occupied = [...tokensMap.values(), ...blocked];
    const { x: left, y: top, columns, rows } = mapBounds();
    for (let y = top; y < top + rows; y++) {
      for (let x = left; x < left + columns; x++) {
        const cell = { x, y, size: 1 };
        if (!occupied.some((other) => overlaps(cell, other))) return { x, y };
      }
    }
    throw new Error("No free cell left on the map");
  }

  return {
    addToken,
    addTokens,
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
