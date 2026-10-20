import { createContext, useCallback, useContext, useState } from "react";
import type { Room } from "../room/createRoom";
import type { DieSides } from "../room/dice";
import { useNewRolls } from "../room/useNewRolls";
import { ROLL_SECONDS } from "./throwPath";
import { isFresh, isNatural20, type Critical } from "./criticalRoll";
import natural20Video from "./natural20.mp4";

interface CriticalInput {
  id: string;
  sides: DieSides;
  value: number;
  delay: number;
}

export function useCriticalRolls(room: Room, isSynced: boolean) {
  const [critical, setCritical] = useState<Critical | null>(null);

  const show = useCallback(({ id, sides, value, delay }: CriticalInput) => {
    if (isNatural20(sides, value)) {
      setCritical({ id, video: natural20Video, delay });
    }
  }, []);
  const clear = useCallback(() => setCritical(null), []);

  // A thrown die lands after its flight, so the video starts then.
  useNewRolls(room.rollsArray, isSynced, (roll) => {
    if (isFresh(roll.at, Date.now())) show({ ...roll, delay: ROLL_SECONDS });
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
