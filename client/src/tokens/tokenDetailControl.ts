import { createContext, useContext } from "react";

interface TokenDetailControl {
  toggle: (id: string) => void;
  // With a mouse, resting on an image shows its token's detail; null when the mouse left it.
  hover: (id: string | null) => void;
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
