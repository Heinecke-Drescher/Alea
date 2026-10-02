import { useThrottledCallback } from "@mantine/hooks";
import type { Vector2d } from "konva/lib/types";
import { useEffect } from "react";
import type { Awareness } from "../room/connectRoom";

const CURSOR_INTERVAL_MS = 50;

export function useCursorBroadcast(
  awareness: Awareness | null,
  playerName: string,
) {
  const send = useThrottledCallback(
    (cursor: Vector2d | null) =>
      awareness?.setLocalStateField("cursor", cursor),
    CURSOR_INTERVAL_MS,
  );

  useEffect(() => {
    awareness?.setLocalStateField("name", playerName);
  }, [awareness, playerName]);

  return {
    move: (point: Vector2d) => send(point),
    // Goes through the throttle too, so a delayed position cannot bring the cursor back.
    leave: () => send(null),
  };
}
