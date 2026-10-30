import { useEffect, useEffectEvent, useRef } from "react";
import { useRoom } from "../room/RoomContext";
import { LOADED_MAP_KEY } from "../room/roomFile";
import { useY } from "../room/useY";

// Once the board has its size, again once the room's own map has loaded, and after every
// import or scene switch, for everyone.
export function useFitOnNewMap(
  fitMap: () => void,
  hasSize: boolean,
  isSynced: boolean,
) {
  const room = useRoom();
  const loadedMapId = useY(room.loadedMapMap)[LOADED_MAP_KEY];
  const fitOnNewMap = useEffectEvent(fitMap);
  const fittedMap = useRef<string | null>(null);

  useEffect(() => {
    const map = `${isSynced}:${loadedMapId}`;
    if (!hasSize || fittedMap.current === map) return;
    fittedMap.current = map;
    fitOnNewMap();
  }, [hasSize, isSynced, loadedMapId]);
}
