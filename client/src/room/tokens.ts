import { nanoid } from "nanoid";
import { tokenEffects, type StatusEffect } from "./effects";
import { isTokenSize, placeToken, type Square } from "./grid";
import type { MapActions } from "./map";
import { isValidMark, MAX_MARKS, tokenMarks, type Mark } from "./marks";
import type { RoomStore, Token, TokenData } from "./roomStore";
import { isInteger, isRecord } from "./typeGuards";

export function embeddedImage(value: string | undefined) {
  return value?.startsWith("data:image/") ? value : null;
}

// Tokens come from other players, so only their known fields are used. Unknown effects and
// broken marks are left out instead of hiding the whole token.
export function validToken(id: string, value: unknown): Token | null {
  if (!isRecord(value)) return null;
  const { name, imageId, x, y, size } = value;
  if (typeof name !== "string" || typeof imageId !== "string") return null;
  if (!isInteger(x) || !isInteger(y) || !isTokenSize(size)) return null;
  const effects = tokenEffects(value);
  const marks = tokenMarks(value);
  return {
    id,
    name,
    imageId,
    x,
    y,
    size,
    ...(effects.length > 0 && { effects }),
    ...(marks.length > 0 && { marks }),
  };
}

export function tokenData(token: Token, image: string): TokenData {
  const { name, x, y, size } = token;
  return {
    name,
    x,
    y,
    size,
    effects: tokenEffects(token),
    marks: tokenMarks(token),
    image,
  };
}

// Leaves out empty effects and marks, so every token in the room has the same form.
export function newToken({ image, effects, marks, ...token }: TokenData) {
  const stored: Token = {
    ...token,
    id: nanoid(),
    imageId: nanoid(),
    ...(effects.length > 0 && { effects }),
    ...(marks.length > 0 && { marks }),
  };
  return { token: stored, image };
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
    const token = validToken(id, tokensMap.get(id));
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
    if (!isTokenSize(size)) {
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
    const token = validToken(id, tokensMap.get(id));
    if (!token) return;
    doc.transact(() => {
      tokensMap.delete(id);
      imagesMap.delete(token.imageId);
    });
  }

  function updateToken(id: string, change: (token: Token) => Token) {
    const token = validToken(id, tokensMap.get(id));
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
