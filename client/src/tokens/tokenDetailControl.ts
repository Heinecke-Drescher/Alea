import { createContext, useContext } from "react";

interface TokenDetailControl {
  toggle: (id: string) => void;
  hide: () => void;
}

// Only phones held upright have room for the detail beside the token sheet; elsewhere it is null.
export const TokenDetailContext = createContext<TokenDetailControl | null>(
  null,
);

export function useTokenDetail() {
  return useContext(TokenDetailContext);
}
