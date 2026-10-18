import type { IRect } from "konva/lib/types";
import { usePlayer } from "../player/PlayerContext";
import {
  foggedCells,
  isCellFogged,
  isSquareHidden,
  pointsTouchFog,
  rectTouchesFog,
} from "../room/fog";
import type { Square } from "../room/grid";
import { useFog } from "../room/useFog";

// The DM works under the fog; players must not change what it hides without seeing it.
export function useFogGuard() {
  const { isDm } = usePlayer();
  const fog = useFog();
  return {
    hidesCell: (x: number, y: number) => !isDm && isCellFogged(fog, x, y),
    hidesSquare: (square: Square) => !isDm && isSquareHidden(fog, square),
    hidesRect: (rect: IRect) => !isDm && rectTouchesFog(fog, rect),
    hidesPoints: (points: number[]) => !isDm && pointsTouchFog(fog, points),
    blockedSquares: () =>
      isDm ? [] : foggedCells(fog).map((cell) => ({ ...cell, size: 1 })),
  };
}
