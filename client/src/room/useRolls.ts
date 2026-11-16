import { useMemo } from "react";
import { useSharedRoom } from "./RoomContext";
import { validRoll } from "./rolls";
import { useY } from "./useY";

export function useRolls() {
  const rolls = useY(useSharedRoom().rollsArray);
  return useMemo(() => rolls.flatMap((roll) => validRoll(roll) ?? []), [rolls]);
}
