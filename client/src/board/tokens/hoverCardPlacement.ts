import type { IRect } from "konva/lib/types";

const GAP = 12;

export interface CardPlacement {
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
  const right = token.x + token.width + GAP;
  const left = Math.max(
    GAP,
    right + cardWidth <= view.width - GAP ? right : token.x - GAP - cardWidth,
  );
  if (token.y + token.height / 2 <= view.height / 2) {
    const top = Math.max(GAP, token.y);
    return { left, top, maxHeight: view.height - top - GAP };
  }
  const bottom = Math.max(GAP, view.height - token.y - token.height);
  return { left, bottom, maxHeight: view.height - bottom - GAP };
}
