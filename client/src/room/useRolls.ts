import { useMemo } from "react";
import { useRoom } from "./RoomContext";
import { validRoll } from "./rolls";
import { useY } from "./useY";

export function useRolls() {
  const rolls = useY(useRoom().rollsArray);
  return useMemo(() => rolls.flatMap((roll) => validRoll(roll) ?? []), [rolls]);
}
