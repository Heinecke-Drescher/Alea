import { nanoid } from "nanoid";
import type * as Y from "yjs";
import { tokenEffects, type StatusEffect } from "./effects";
import { isTokenSize, placeToken, type Square } from "./grid";
import type { MapActions } from "./map";
import { isValidMark, MAX_MARKS, tokenMarks, type Mark } from "./marks";
import {
  validValues,
  type RoomStore,
  type Token,
  type TokenData,
} from "./roomStore";
import { isFiniteNumber, isInteger, isRecord } from "./typeGuards";

export function embeddedImage(value: string | undefined) {
  return value?.startsWith("data:image/") ? value : null;
}

// Tokens come from other players, so only their known fields are used. Unknown effects and
// broken marks are left out instead of hiding the whole token.
export function validToken(id: string, value: unknown): Token | null {
  if (!isRecord(value)) return null;
  const { name, imageId, x, y, size, order } = value;
  if (typeof name !== "string" || typeof imageId !== "string") return null;
  if (!isInteger(x) || !isInteger(y) || !isTokenSize(size)) return null;
  if (!isFiniteNumber(order)) return null;
  const effects = tokenEffects(value);
  const marks = tokenMarks(value);
  return {
    id,
    name,
    imageId,
    x,
    y,
    size,
    order,
    ...(effects.length > 0 && { effects }),
    ...(marks.length > 0 && { marks }),
  };
}

// Tokens added by two players at the same time can share an order; their ids then decide, so
// everyone sees the same list.
export function byListOrder(a: Token, b: Token) {
  return a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function listedTokens(tokensMap: Y.Map<unknown>) {
  return validValues(tokensMap.entries(), validToken).sort(byListOrder);
}

export function endOfList(tokensMap: Y.Map<unknown>) {
  return listedTokens(tokensMap).reduce(
    (end, token) => Math.max(end, token.order + 1),
    0,
  );
}

// Null when the two orders lie too close together to fit another number between them.
export function orderBetween(
  lower: number | undefined,
  upper: number | undefined,
) {
  if (lower === undefined) return upper === undefined ? 0 : upper - 1;
  if (upper === undefined) return lower + 1;
  const middle = (lower + upper) / 2;
  return lower < middle && middle < upper ? middle : null;
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
export function newToken(
  { image, effects, marks, ...token }: TokenData,
  order: number,
) {
  const stored: Token = {
    ...token,
    id: nanoid(),
    imageId: nanoid(),
    order,
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
      tokensMap.set(id, {
        id,
        name,
        imageId,
        x,
        y,
        size: 1,
        order: endOfList(tokensMap),
      });
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
    undoManager.stopCapturing();
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

  // Null puts the token at the end of the list.
  function moveToken(id: string, beforeId: string | null) {
    const listed = listedTokens(tokensMap);
    const token = listed.find((other) => other.id === id);
    if (!token) return;
    const others = listed.filter((other) => other.id !== id);
    const index =
      beforeId === null
        ? others.length
        : others.findIndex((other) => other.id === beforeId);
    if (index === -1 || index === listed.indexOf(token)) return;
    const order = orderBetween(others[index - 1]?.order, others[index]?.order);
    undoManager.stopCapturing();
    doc.transact(() => {
      if (order !== null) {
        tokensMap.set(id, { ...token, order });
        return;
      }
      others.splice(index, 0, token);
      others.forEach((other, i) => {
        if (other.order !== i) tokensMap.set(other.id, { ...other, order: i });
      });
    });
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
    moveToken,
    removeToken,
  };
}
