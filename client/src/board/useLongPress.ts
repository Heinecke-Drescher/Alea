import { useTimeout } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { isBeyondTap } from "../tap";

// As in Excalidraw and tldraw.
const LONG_PRESS_MS = 500;

// A finger held still stands in for the right click. An own timer, as browsers differ in what a
// long press does.
export function useLongPress(
  onLongPress: (event: KonvaEventObject<PointerEvent>) => void,
) {
  const start = useRef<Vector2d | null>(null);
  const timeout = useTimeout(onLongPress, LONG_PRESS_MS);

  function cancel() {
    start.current = null;
    timeout.clear();
  }

  return {
    begin(event: KonvaEventObject<PointerEvent>) {
      cancel();
      if (event.evt.pointerType !== "touch") return;
      start.current = { x: event.evt.clientX, y: event.evt.clientY };
      timeout.start(event);
    },
    move(event: KonvaEventObject<PointerEvent>) {
      const from = start.current;
      if (!from) return;
      const to = { x: event.evt.clientX, y: event.evt.clientY };
      if (isBeyondTap(from, to)) cancel();
    },
    cancel,
  };
}
