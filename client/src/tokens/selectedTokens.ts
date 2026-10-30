import { createContext, useContext } from "react";

export const SelectedTokensContext = createContext<readonly string[]>([]);

export function useSelectedTokens() {
  return useContext(SelectedTokensContext);
}
