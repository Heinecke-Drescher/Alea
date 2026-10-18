import type { IRect } from "konva/lib/types";
import { usePlayer } from "../player/PlayerContext";
import { pointsTouchFog, rectTouchesFog } from "../room/fog";
import { useFog } from "../room/useFog";

// The DM works under the fog; players must not change what it hides without seeing it.
export function useFogGuard() {
  const { isDm } = usePlayer();
  const fog = useFog();
  return {
    hidesRect: (rect: IRect) => !isDm && rectTouchesFog(fog, rect),
    hidesPoints: (points: number[]) => !isDm && pointsTouchFog(fog, points),
  };
}
