// A finger moves more while tapping than a mouse while clicking. In screen pixels, as a finger
// does not zoom with the map.
export const TAP_SCREEN_DISTANCE = 10;

export function isBeyondTap(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  return Math.hypot(to.x - from.x, to.y - from.y) > TAP_SCREEN_DISTANCE;
}
