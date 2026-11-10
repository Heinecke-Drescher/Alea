import { createContext, useContext } from "react";

// Copies a token where a pointer let go of it, in pixels of the browser window.
export const DropTokenContext = createContext<
  ((id: string, point: { x: number; y: number }) => void) | null
>(null);

export function useDropToken() {
  const dropToken = useContext(DropTokenContext);
  if (!dropToken) throw new Error("Dropping tokens is not provided");
  return dropToken;
}
