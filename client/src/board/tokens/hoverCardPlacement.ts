import type { IRect } from "konva/lib/types";
import { FLOATING_GAP } from "../../FloatingPanel";

interface CardPlacement {
  left: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

// Beside the token, to its right unless the view ends there; level with its top in the upper half
// of the view and with its bottom in the lower half, so the card grows towards the free space.
export function hoverCardPlacement(
  token: IRect,
  view: { width: number; height: number },
  cardWidth: number,
): CardPlacement {
  const right = token.x + token.width + FLOATING_GAP;
  const left = Math.max(
    FLOATING_GAP,
    right + cardWidth <= view.width - FLOATING_GAP
      ? right
      : token.x - FLOATING_GAP - cardWidth,
  );
  if (token.y + token.height / 2 <= view.height / 2) {
    const top = Math.max(FLOATING_GAP, token.y);
    return { left, top, maxHeight: view.height - top - FLOATING_GAP };
  }
  const bottom = Math.max(FLOATING_GAP, view.height - token.y - token.height);
  return { left, bottom, maxHeight: view.height - bottom - FLOATING_GAP };
}
