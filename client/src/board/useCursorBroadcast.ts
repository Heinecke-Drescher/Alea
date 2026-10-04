import { useThrottledCallback } from "@mantine/hooks";
import type { Vector2d } from "konva/lib/types";
import { useEffect } from "react";
import type { Awareness } from "../room/connectRoom";
import { usePlayer } from "../player/PlayerContext";

const CURSOR_INTERVAL_MS = 50;

export function useCursorBroadcast(awareness: Awareness | null) {
  const { id, name, color } = usePlayer();
  const send = useThrottledCallback(
    (cursor: Vector2d | null) =>
      awareness?.setLocalStateField("cursor", cursor),
    CURSOR_INTERVAL_MS,
  );

  useEffect(() => {
    awareness?.setLocalStateField("playerId", id);
    awareness?.setLocalStateField("name", name);
    awareness?.setLocalStateField("color", color);
  }, [awareness, id, name, color]);

  return {
    move: (point: Vector2d) => send(point),
    // Goes through the throttle too, so a delayed position cannot bring the cursor back.
    leave: () => send(null),
  };
}
