import { createContext, useContext, useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { rollDie, type DieSides } from "../room/dice";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { rollSecretly, type SecretRoll } from "./secretRoll";
import { useShowCritical } from "./useCriticalRolls";

const MAX_SECRET_ROLLS = 20;

// Kept above the dice tray and the dice bar, so secret rolls survive a change of layout.
export function useDiceState() {
  const room = useRoom();
  const player = usePlayer();
  const rolls = [...useY(room.rollsArray)].reverse();
  const [isSecret, setSecret] = useState(false);
  const [secretRolls, setSecretRolls] = useState<SecretRoll[]>([]);
  const showCritical = useShowCritical();

  function roll(sides: DieSides) {
    // Secret rolls stay in this browser and never reach the room document.
    if (isSecret) {
      const secretRoll = rollSecretly(sides);
      setSecretRolls((previous) =>
        [secretRoll, ...previous].slice(0, MAX_SECRET_ROLLS),
      );
      showCritical({ ...secretRoll, color: player.color, thrown: false });
      return;
    }
    room.addRoll(player.name, player.color, sides, rollDie(sides));
  }

  return { rolls, isSecret, setSecret, secretRolls, roll };
}

export const DiceContext = createContext<ReturnType<
  typeof useDiceState
> | null>(null);

export function useDice() {
  const dice = useContext(DiceContext);
  if (!dice) throw new Error("Dice are not provided");
  return dice;
}
