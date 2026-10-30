import type { IRect } from "konva/lib/types";
import { nanoid } from "nanoid";
import type { MapText, MapTextData, RoomStore } from "./roomStore";

// Keeps a pasted document from filling the room, which would disconnect everyone.
export const MAX_TEXT_LENGTH = 1000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSize(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

// Texts come from other players, so only their known fields are used.
export function validMapText(value: unknown): MapText | null {
  if (typeof value !== "object" || value === null) return null;
  const { id, text, x, y, width, height, color, overFog } = value as Partial<
    Record<keyof MapText, unknown>
  >;
  if (typeof id !== "string" || typeof text !== "string") return null;
  if (text === "" || text.length > MAX_TEXT_LENGTH) return null;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
  if (!isSize(width) || !isSize(height)) return null;
  if (typeof color !== "string") return null;
  if (overFog !== undefined && overFog !== true) return null;
  return {
    id,
    text,
    x,
    y,
    width,
    height,
    color,
    ...(overFog && { overFog }),
  };
}

export function textData({
  text,
  x,
  y,
  width,
  height,
  color,
  overFog,
}: MapText): MapTextData {
  return { text, x, y, width, height, color, ...(overFog && { overFog }) };
}

export function textTouches(text: MapTextData, area: IRect) {
  return (
    text.x <= area.x + area.width &&
    text.x + text.width >= area.x &&
    text.y <= area.y + area.height &&
    text.y + text.height >= area.y
  );
}

function assertValid(data: MapTextData) {
  if (!validMapText({ ...data, id: "new" })) {
    throw new Error(`Invalid text ${JSON.stringify(data)}`);
  }
}

export function createTexts({ textsMap, undoManager }: RoomStore) {
  function addText(data: MapTextData) {
    assertValid(data);
    const id = nanoid();
    undoManager.stopCapturing();
    textsMap.set(id, { ...data, id });
    return id;
  }

  // An emptied text is removed, as a text without words cannot be seen or picked.
  function editText(
    id: string,
    change: Pick<MapText, "text" | "width" | "height">,
  ) {
    const text = textsMap.get(id);
    if (!text) return;
    if (change.text === "") {
      removeText(id);
      return;
    }
    const edited = { ...text, ...change };
    assertValid(edited);
    undoManager.stopCapturing();
    textsMap.set(id, edited);
  }

  function removeText(id: string) {
    undoManager.stopCapturing();
    textsMap.delete(id);
  }

  return { addText, editText, removeText };
}
