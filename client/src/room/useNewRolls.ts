import { useEffect, useEffectEvent } from "react";
import type * as Y from "yjs";
import type { Roll } from "./roomStore";

// Reports only rolls added while enabled, so rolls loaded with the room are not reported.
export function useNewRolls(
  rollsArray: Y.Array<Roll>,
  enabled: boolean,
  onRoll: (roll: Roll) => void,
) {
  const reportRoll = useEffectEvent(onRoll);

  useEffect(() => {
    if (!enabled) return;
    const observer = (event: Y.YArrayEvent<Roll>) => {
      for (const { insert } of event.changes.delta) {
        if (!Array.isArray(insert)) continue;
        for (const roll of insert as Roll[]) reportRoll(roll);
      }
    };
    rollsArray.observe(observer);
    return () => {
      rollsArray.unobserve(observer);
    };
  }, [rollsArray, enabled]);
}
