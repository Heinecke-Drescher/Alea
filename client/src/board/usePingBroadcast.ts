import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import type { Awareness } from "../room/connectRoom";

// So one player cannot flood everyone's screen with rings.
const PING_INTERVAL_MS = 500;

export function usePingBroadcast(awareness: Awareness | null) {
  const lastPingAt = useRef(0);

  return (point: Vector2d) => {
    const now = Date.now();
    if (now - lastPingAt.current < PING_INTERVAL_MS) return;
    lastPingAt.current = now;
    awareness?.setLocalStateField("ping", { x: point.x, y: point.y, at: now });
  };
}
