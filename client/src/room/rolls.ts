import { nanoid } from "nanoid";
import type { DieSides } from "../../../shared/dice";
import { isPlayerColor, type PlayerColor } from "./playerColors";
import type { Roll, RoomStore } from "./roomStore";

const MAX_ROLLS = 50;
const MAX_PATH_POINTS = 16;

// Rolls come from other players, so their color and path are checked before they are shown.
export function rollColor(roll: Roll): PlayerColor | "gray" {
  return isPlayerColor(roll.color) ? roll.color : "gray";
}

export function rollPath(roll: Roll): number[] | null {
  const { path } = roll;
  if (!Array.isArray(path)) return null;
  if (path.length < 4 || path.length % 2 !== 0) return null;
  if (path.length > MAX_PATH_POINTS * 2) return null;
  return path.every((value) => Number.isFinite(value)) ? path : null;
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
