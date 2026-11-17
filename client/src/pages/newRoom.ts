import { useEffect, useEffectEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Room } from "../room/createRoom";
import type { DungeonMaster } from "../room/roomStore";
import { isRecord } from "../room/typeGuards";

// Passed along by "Create room", so only whoever created the room becomes its DM, not who opens a
// link to it.
export const NEW_ROOM_STATE = { isNew: true };

export function useCreatorBecomesDm(
  room: Room,
  isSynced: boolean,
  player: DungeonMaster,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = isRecord(location.state) && location.state.isNew === true;
  const claim = useEffectEvent(() => {
    room.becomeDmIfNone(player);
    // The state would survive a reload and hand the role back to a creator who gave it away.
    navigate(location.pathname, { replace: true, state: null });
  });
  useEffect(() => {
    if (isSynced && isNew) claim();
  }, [isSynced, isNew]);
}
