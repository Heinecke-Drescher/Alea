import { createContext, useContext } from "react";

export interface HeldToken {
  name: string;
  imageDataUrl: string;
}

// New tokens are held until the map is clicked where they belong.
export const HoldTokensContext = createContext<
  ((tokens: HeldToken[]) => void) | null
>(null);

export function useHoldTokens() {
  const holdTokens = useContext(HoldTokensContext);
  if (!holdTokens) throw new Error("Holding tokens is not provided");
  return holdTokens;
}
