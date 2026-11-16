import { useWindowEvent } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";
import { showRoomSpaceError } from "../images/showRoomSpaceError";
import type { Room } from "../room/createRoom";
import { DM_KEY, validDm } from "../room/dm";
import { createPreparation, type Preparation } from "../room/preparation";

const SAVE_DELAY_MS = 5000;

// Whether nothing is left unsaved. A full room keeps the preparation open, so nothing is lost.
function saveNow(preparation: Preparation) {
  if (!preparation.isUnsaved() || !preparation.canSave()) return true;
  try {
    preparation.save();
    return true;
  } catch (error) {
    showRoomSpaceError(error);
    return false;
  }
}

function notifyEnded(message: string) {
  notifications.show({ title: "Preparation ended", message });
}

// Kept in the room view, as it decides which room the map shows.
export function usePreparation(live: Room, playerId: string) {
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  // Putting the scene on the map ends its preparation on purpose, without a notice.
  const shownToPlayers = useRef<Preparation | null>(null);

  // Leaving the room saves what is left; the room's connection may already be gone by then.
  useEffect(() => {
    if (!preparation) return;
    let timer: number | undefined;
    const saveLater = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => saveNow(preparation), SAVE_DELAY_MS);
    };
    const endWhenTakenAway = () => {
      const dm = validDm(live.rolesMap.get(DM_KEY));
      if (!preparation.canSave()) {
        setPreparation(null);
        if (shownToPlayers.current !== preparation) {
          notifyEnded("The scene was deleted or put on the map.");
        }
      } else if (
        dm !== null &&
        dm.playerId !== playerId &&
        saveNow(preparation)
      ) {
        setPreparation(null);
        notifyEnded("Only the DM can prepare scenes.");
      }
    };
    preparation.room.doc.on("update", saveLater);
    live.scenesMap.observe(endWhenTakenAway);
    live.activeSceneMap.observe(endWhenTakenAway);
    live.rolesMap.observe(endWhenTakenAway);
    return () => {
      window.clearTimeout(timer);
      preparation.room.doc.off("update", saveLater);
      live.scenesMap.unobserve(endWhenTakenAway);
      live.activeSceneMap.unobserve(endWhenTakenAway);
      live.rolesMap.unobserve(endWhenTakenAway);
      saveNow(preparation);
      preparation.destroy();
    };
  }, [preparation, live, playerId]);

  useWindowEvent("beforeunload", (event) => {
    if (preparation?.isUnsaved()) event.preventDefault();
  });

  function leave() {
    if (preparation && !saveNow(preparation)) return;
    setPreparation(null);
  }

  function prepare(sceneId: string) {
    if (preparation && !saveNow(preparation)) return;
    setPreparation(createPreparation(live, sceneId));
  }

  function showToPlayers() {
    if (!preparation || !saveNow(preparation)) return;
    shownToPlayers.current = preparation;
    setPreparation(null);
    try {
      live.switchScene(preparation.sceneId);
    } catch (error) {
      showRoomSpaceError(error);
    }
  }

  return { preparation, prepare, leave, showToPlayers };
}
