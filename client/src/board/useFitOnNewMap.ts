import { useEffect, useEffectEvent, useRef } from "react";
import { useRoom } from "../room/RoomContext";
import { ACTIVE_SCENE_KEY } from "../room/scenes";
import { useY } from "../room/useY";

// Once the board has its size, again once the room's own map has loaded, and after every
// scene switch, for everyone.
export function useFitOnNewMap(
  fitMap: () => void,
  hasSize: boolean,
  isSynced: boolean,
) {
  const room = useRoom();
  const sceneId = useY(room.activeSceneMap)[ACTIVE_SCENE_KEY];
  const fitOnNewMap = useEffectEvent(fitMap);
  const fittedMap = useRef<string | null>(null);

  useEffect(() => {
    const map = `${isSynced}:${sceneId}`;
    if (!hasSize || fittedMap.current === map) return;
    fittedMap.current = map;
    fitOnNewMap();
  }, [hasSize, isSynced, sceneId]);
}
