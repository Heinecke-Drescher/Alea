import { nanoid } from "nanoid";
import type { DieSides } from "../../../shared/dice";
import { isPlayerColor, type PlayerColor } from "./playerColors";
import type { Roll, RoomStore } from "./roomStore";

const MAX_ROLLS = 50;

// Rolls come from other players, so the color is checked before it is shown.
export function rollColor(roll: Roll): PlayerColor | "gray" {
  return isPlayerColor(roll.color) ? roll.color : "gray";
}

export function createRolls({ doc, rollsArray }: RoomStore) {
  function addRoll(
    player: string,
    color: PlayerColor,
    sides: DieSides,
    value: number,
    position?: Roll["position"],
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
        },
      ]);
      const excess = rollsArray.length - MAX_ROLLS;
      if (excess > 0) rollsArray.delete(0, excess);
    });
  }

  return { addRoll };
}
