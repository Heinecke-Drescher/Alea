import type { DieSides } from "../room/dice";
import type { rollColor } from "../room/rolls";

// Older rolls arrive after a reconnect; their moment has passed.
const FRESH_MILLISECONDS = 10_000;

export type CriticalKind = "natural20" | "natural1";

export function criticalKind(
  sides: DieSides,
  value: number,
): CriticalKind | null {
  if (sides !== 20) return null;
  if (value === 20) return "natural20";
  if (value === 1) return "natural1";
  return null;
}

export function isFresh(at: number, now: number) {
  return now - at <= FRESH_MILLISECONDS;
}

export interface Critical {
  id: string;
  kind: CriticalKind;
  color: ReturnType<typeof rollColor>;
  // A thrown die is on the map; secret rolls are not.
  thrown: boolean;
}
