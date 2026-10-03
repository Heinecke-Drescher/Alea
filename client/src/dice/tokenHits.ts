import type { Vector2d } from "konva/lib/types";
import { CELL_SIZE } from "../room/grid";
import type { Token } from "../room/roomStore";
import { segments } from "./throwPath";

export interface TokenHit {
  tokenId: string;
  distance: number;
  direction: Vector2d;
}

function tokenCenter({ x, y, size }: Token): Vector2d {
  return { x: (x + size / 2) * CELL_SIZE, y: (y + size / 2) * CELL_SIZE };
}

function contactShare(
  from: Vector2d,
  to: Vector2d,
  center: Vector2d,
  reach: number,
): number | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const fx = from.x - center.x;
  const fy = from.y - center.y;
  if (Math.hypot(fx, fy) <= reach) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - reach * reach;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const share = (-b - Math.sqrt(discriminant)) / (2 * a);
  return share >= 0 && share <= 1 ? share : null;
}

export function tokenHits(
  path: number[],
  tokens: Token[],
  dieRadius: number,
): TokenHit[] {
  const hits: TokenHit[] = [];
  for (const token of tokens) {
    const center = tokenCenter(token);
    const reach = (token.size * CELL_SIZE) / 2 + dieRadius;
    let travelled = 0;
    for (const { from, to, length } of segments(path)) {
      const share = contactShare(from, to, center, reach);
      if (share !== null && length > 0) {
        hits.push({
          tokenId: token.id,
          distance: travelled + share * length,
          direction: {
            x: (to.x - from.x) / length,
            y: (to.y - from.y) / length,
          },
        });
        break;
      }
      travelled += length;
    }
  }
  return hits;
}
