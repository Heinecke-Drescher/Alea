import { createContext, useContext } from "react";

export const FocusTokenContext = createContext<((id: string) => void) | null>(
  null,
);

export function useFocusToken() {
  const focusToken = useContext(FocusTokenContext);
  if (!focusToken) throw new Error("Focusing tokens is not provided");
  return focusToken;
}
