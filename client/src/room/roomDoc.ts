import { nanoid } from "nanoid";
import * as Y from "yjs";
import { COLUMNS, ROWS } from "../board/grid";

export interface Token {
  id: string;
  name: string;
  imageId: string;
  x: number;
  y: number;
  size: number;
}

export interface Cell {
  x: number;
  y: number;
  color: string;
}

export interface Stroke {
  id: string;
  color: string;
  points: number[];
}

export const roomDoc = new Y.Doc();
export const tokensMap = roomDoc.getMap<Token>("tokens");
export const imagesMap = roomDoc.getMap<string>("images");
export const cellsMap = roomDoc.getMap<Cell>("cells");

export function paintCell(x: number, y: number, color: string) {
  const key = `${x},${y}`;
  if (cellsMap.get(key)?.color === color) return;
  cellsMap.set(key, { x, y, color });
}

export function eraseCell(x: number, y: number) {
  cellsMap.delete(`${x},${y}`);
}

export const strokesMap = roomDoc.getMap<Stroke>("strokes");

export function addStroke(color: string, points: number[]) {
  const id = nanoid();
  strokesMap.set(id, { id, color, points });
}

export function removeStroke(id: string) {
  strokesMap.delete(id);
}

export function clearDrawings() {
  roomDoc.transact(() => {
    cellsMap.clear();
    strokesMap.clear();
  });
}

export function addToken(name: string, imageDataUrl: string) {
  const id = nanoid();
  const imageId = nanoid();
  const { x, y } = findFreeCell();
  roomDoc.transact(() => {
    imagesMap.set(imageId, imageDataUrl);
    tokensMap.set(id, { id, name, imageId, x, y, size: 1 });
  });
}

export function moveToken(id: string, x: number, y: number) {
  updateToken(id, (token) => ({ ...token, x, y }));
}

export function renameToken(id: string, name: string) {
  updateToken(id, (token) => ({ ...token, name }));
}

export function resizeToken(id: string, size: number) {
  updateToken(id, (token) => ({
    ...token,
    size,
    x: Math.min(token.x, COLUMNS - size),
    y: Math.min(token.y, ROWS - size),
  }));
}

export function removeToken(id: string) {
  const token = tokensMap.get(id);
  if (!token) return;
  roomDoc.transact(() => {
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
  const occupied = new Set(Array.from(tokensMap.values(), coveredCells).flat());
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  throw new Error("No free cell left on the map");
}

function coveredCells(token: Token): string[] {
  const cells: string[] = [];
  for (let dy = 0; dy < token.size; dy++) {
    for (let dx = 0; dx < token.size; dx++) {
      cells.push(`${token.x + dx},${token.y + dy}`);
    }
  }
  return cells;
}
