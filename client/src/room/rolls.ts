import { nanoid } from "nanoid";
import { isDieSides, type DieSides } from "./dice";
import { isPlayerColor, type PlayerColor } from "./playerColors";
import { validPoint } from "./points";
import type { Roll, RoomStore } from "./roomStore";
import { isFiniteNumber, isInteger, isRecord } from "./typeGuards";

const MAX_ROLLS = 50;
const MAX_PATH_POINTS = 16;

export function rollColor(roll: Roll): PlayerColor | "gray" {
  return roll.color ?? "gray";
}

export function rollPath({ path }: Record<string, unknown>): number[] | null {
  if (!Array.isArray(path)) return null;
  if (path.length < 4 || path.length % 2 !== 0) return null;
  if (path.length > MAX_PATH_POINTS * 2) return null;
  return path.every(isFiniteNumber) ? path : null;
}

// Rolls come from other players. One without a valid player, die or result is left out; a broken
// color shows gray, and a broken path or landing place is ignored, so the die lands in the view.
export function validRoll(value: unknown): Roll | null {
  if (!isRecord(value)) return null;
  const { id, player, sides, value: result, at, color } = value;
  if (typeof id !== "string" || typeof player !== "string") return null;
  if (!isDieSides(sides) || !isInteger(result)) return null;
  if (result < 1 || result > sides || !isFiniteNumber(at)) return null;
  const position = validPoint(value.position);
  const path = rollPath(value);
  return {
    id,
    player,
    sides,
    value: result,
    at,
    ...(isPlayerColor(color) && { color }),
    ...(position && { position }),
    ...(path && { path }),
  };
}

export function createRolls({ doc, rollsArray }: RoomStore) {
  function addRoll(
    player: string,
    color: PlayerColor,
    sides: DieSides,
    value: number,
    position?: Roll["position"],
    path?: number[],
  ) {
    doc.transact(() => {
      rollsArray.push([
        {
          id: nanoid(),
          player,
          color,
          sides,
          value,
          at: Date.now(),
          ...(position && { position }),
          ...(path && { path }),
        },
      ]);
      const excess = rollsArray.length - MAX_ROLLS;
      if (excess > 0) rollsArray.delete(0, excess);
    });
  }

  return { addRoll };
}
