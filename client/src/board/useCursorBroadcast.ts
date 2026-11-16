import { useThrottledCallback } from "@mantine/hooks";
import type { Vector2d } from "konva/lib/types";
import { useEffect } from "react";
import type { Awareness } from "../room/connection/connectRoom";

const CURSOR_INTERVAL_MS = 50;

export function useCursorBroadcast(awareness: Awareness | null) {
  const send = useThrottledCallback(
    (cursor: Vector2d | null) =>
      awareness?.setLocalStateField("cursor", cursor),
    CURSOR_INTERVAL_MS,
  );

  // Without it, others would keep seeing the cursor where it left the map, e.g. while a scene
  // is prepared. The throttle drops its pending position on unmount before this runs.
  useEffect(
    () => () => awareness?.setLocalStateField("cursor", null),
    [awareness],
  );

  return {
    move: (point: Vector2d) => send(point),
    // Goes through the throttle too, so a delayed position cannot bring the cursor back.
    leave: () => send(null),
  };
}
