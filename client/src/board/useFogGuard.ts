import type { IRect } from "konva/lib/types";
import { usePlayer } from "../player/PlayerContext";
import { pointsTouchFog, rectTouchesFog } from "../room/fog";
import { useFog } from "../room/useFog";

// The DM works under the fog; players must not change what it hides without seeing it.
export function useFogGuard() {
  const { isDm } = usePlayer();
  const fog = useFog();
  const guarded = { ...fog, enabled: fog.enabled && !isDm };
  return {
    hidesRect: (rect: IRect) => rectTouchesFog(guarded, rect),
    hidesPoints: (points: number[]) => pointsTouchFog(guarded, points),
  };
}
