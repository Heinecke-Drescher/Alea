import { createContext, useCallback, useContext, useState } from "react";
import type { Room } from "../room/createRoom";
import type { DieSides } from "../room/dice";
import { rollColor } from "../room/rolls";
import { useNewRolls } from "../room/useNewRolls";
import { isFresh, isNatural20, type Critical } from "./criticalRoll";

interface CriticalInput {
  id: string;
  sides: DieSides;
  value: number;
  color: ReturnType<typeof rollColor>;
  thrown: boolean;
}

export function useCriticalRolls(room: Room, isSynced: boolean) {
  const [critical, setCritical] = useState<Critical | null>(null);

  const show = useCallback(
    ({ id, sides, value, color, thrown }: CriticalInput) => {
      if (isNatural20(sides, value)) {
        setCritical({ id, color, thrown });
      }
    },
    [],
  );
  // Late callbacks of a replaced scene must not close the next one.
  const clear = useCallback(
    (id: string) =>
      setCritical((current) => (current?.id === id ? null : current)),
    [],
  );

  useNewRolls(room.rollsArray, isSynced, (roll) => {
    if (isFresh(roll.at, Date.now()))
      show({ ...roll, color: rollColor(roll), thrown: true });
  });

  return { critical, show, clear };
}

export const ShowCriticalContext = createContext<
  ((input: CriticalInput) => void) | null
>(null);

export function useShowCritical() {
  const show = useContext(ShowCriticalContext);
  if (!show) throw new Error("Critical rolls are not provided");
  return show;
}
