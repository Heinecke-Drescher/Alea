import type { KonvaEventObject } from "konva/lib/Node";

// Also what touch and pen report, so a finger acts like the left mouse button.
export const PRIMARY_BUTTON = 0;
// The same button in PointerEvent.buttons, which is a bit mask.
export const PRIMARY_BUTTON_FLAG = 1;

export function pointerOnMap(event: KonvaEventObject<MouseEvent>) {
  const pointer = event.target.getStage()?.getRelativePointerPosition();
  if (!pointer) throw new Error("Pointer event without stage pointer");
  return pointer;
}
