import { useEffect, useEffectEvent } from "react";
import type * as Y from "yjs";
import { validRoll } from "./rolls";
import type { Roll } from "./roomStore";

// Reports only rolls added while enabled, so rolls loaded with the room are not reported.
export function useNewRolls(
  rollsArray: Y.Array<unknown>,
  enabled: boolean,
  onRoll: (roll: Roll) => void,
) {
  const reportRoll = useEffectEvent(onRoll);

  useEffect(() => {
    if (!enabled) return;
    const observer = (event: Y.YArrayEvent<unknown>) => {
      for (const { insert } of event.changes.delta) {
        if (!Array.isArray(insert)) continue;
        for (const value of insert) {
          const roll = validRoll(value);
          if (roll) reportRoll(roll);
        }
      }
    };
    rollsArray.observe(observer);
    return () => {
      rollsArray.unobserve(observer);
    };
  }, [rollsArray, enabled]);
}
