import { createContext, useContext, type MouseEvent } from "react";

export const TokenMenuContext = createContext<
  ((id: string, event: MouseEvent) => void) | null
>(null);

export function useOpenTokenMenu() {
  const openTokenMenu = useContext(TokenMenuContext);
  if (!openTokenMenu) throw new Error("Token menus are not provided");
  return openTokenMenu;
}
