import { createContext, useContext } from "react";

interface TokenDetailControl {
  toggle: (id: string) => void;
  hide: () => void;
}

export const TokenDetailContext = createContext<TokenDetailControl | null>(
  null,
);

export function useTokenDetail() {
  const detail = useContext(TokenDetailContext);
  if (!detail) throw new Error("Token details are not provided");
  return detail;
}
