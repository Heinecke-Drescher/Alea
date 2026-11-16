import { useMemo } from "react";
import { validCell } from "./drawing";
import { useRoom } from "./RoomContext";
import { validValues } from "./roomStore";
import { useY } from "./useY";

export function useCells() {
  const cells = useY(useRoom().cellsMap);
  return useMemo(() => validValues(Object.entries(cells), validCell), [cells]);
}
