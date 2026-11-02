import type { ReactNode } from "react";
import { DiceContext, useDiceState } from "./useDice";

export function DiceProvider({ children }: { children: ReactNode }) {
  return <DiceContext value={useDiceState()}>{children}</DiceContext>;
}
