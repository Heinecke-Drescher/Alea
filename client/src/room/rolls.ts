import { nanoid } from "nanoid";
import type { DieSides } from "../../../shared/dice";
import type { Roll, RoomStore } from "./roomStore";

const MAX_ROLLS = 50;

export function createRolls({ doc, rollsArray }: RoomStore) {
  function addRoll(
    player: string,
    sides: DieSides,
    value: number,
    position?: Roll["position"],
  ) {
    doc.transact(() => {
      rollsArray.push([
        {
          id: nanoid(),
          player,
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
