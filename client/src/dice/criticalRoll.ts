import type { DieSides } from "../room/dice";
import type { rollColor } from "../room/rolls";

// Older rolls arrive after a reconnect; their moment has passed.
const FRESH_MILLISECONDS = 10_000;

export function isNatural20(sides: DieSides, value: number) {
  return sides === 20 && value === 20;
}

export function isFresh(at: number, now: number) {
  return now - at <= FRESH_MILLISECONDS;
}

export interface Critical {
  id: string;
  color: ReturnType<typeof rollColor>;
  // A thrown die is on the map; secret rolls are not.
  thrown: boolean;
}
