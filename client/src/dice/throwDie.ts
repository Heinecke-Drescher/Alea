import { createContext, useContext } from "react";
import type { DieSides } from "../room/dice";

// Where the pointer was, in pixels of the browser window.
export interface ScreenSample {
  x: number;
  y: number;
  time: number;
}

export const ThrowDieContext = createContext<
  ((sides: DieSides, samples: ScreenSample[]) => void) | null
>(null);

export function useThrowDie() {
  const throwDie = useContext(ThrowDieContext);
  if (!throwDie) throw new Error("Throwing dice onto the map is not provided");
  return throwDie;
}
