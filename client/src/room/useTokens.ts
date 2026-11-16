import { useMemo } from "react";
import { useRoom } from "./RoomContext";
import { validValues } from "./roomStore";
import { validToken } from "./tokens";
import { useY } from "./useY";

export function useTokens() {
  const tokens = useY(useRoom().tokensMap);
  return useMemo(
    () => validValues(Object.entries(tokens), validToken),
    [tokens],
  );
}

export function useToken(id: string) {
  return validToken(id, useY(useRoom().tokensMap)[id]);
}
