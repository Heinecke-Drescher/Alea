import { useMemo } from "react";
import { validStroke } from "./drawing";
import { useRoom } from "./RoomContext";
import { validValues } from "./roomStore";
import { useY } from "./useY";

export function useStrokes() {
  const strokes = useY(useRoom().strokesMap);
  return useMemo(
    () => validValues(Object.entries(strokes), validStroke),
    [strokes],
  );
}

export function useStroke(id: string) {
  return validStroke(id, useY(useRoom().strokesMap)[id]);
}
