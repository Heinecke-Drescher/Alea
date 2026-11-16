import * as Y from "yjs";
import { createRoom } from "./createRoom";
import { exportMap, parseMap, writeMap, type MapFile } from "./roomFile";
import { assertRoomFits, changedCopy, type SpaceMeter } from "./roomSpace";
import { OUTSIDE_UNDO, type RoomStore } from "./roomStore";
import { ACTIVE_SCENE_KEY, sceneTab } from "./scenes";

export type Preparation = ReturnType<typeof createPreparation>;

function putSceneFile(store: RoomStore, sceneId: string, file: MapFile) {
  const tab = sceneTab(sceneId, store.scenesMap.get(sceneId));
  if (!tab) throw new Error(`Unknown scene ${sceneId}`);
  store.scenesMap.set(sceneId, { name: tab.name, order: tab.order, file });
}

// Others may delete the scene or put it on the map while it is being prepared.
export function canPrepare(live: RoomStore, sceneId: string) {
  return (
    sceneTab(sceneId, live.scenesMap.get(sceneId)) !== null &&
    live.activeSceneMap.get(ACTIVE_SCENE_KEY) !== sceneId
  );
}

// The prepared scene is saved as a map file into the shared room, so that is what has to fit.
function preparedMeter(
  live: RoomStore,
  sceneId: string,
  doc: Y.Doc,
): SpaceMeter {
  function liveBytesWith(change: (copy: RoomStore) => void) {
    const file = exportMap(changedCopy(doc, change));
    return live.meter.bytesAfter((copy) => putSceneFile(copy, sceneId, file));
  }
  return {
    bytes: () => liveBytesWith(() => {}),
    bytesAfter: liveBytesWith,
  };
}

// A scene off the map, opened in a room of its own that only this browser sees, so players
// keep playing while it is prepared. Saving writes it back as the scene's map file.
export function createPreparation(live: RoomStore, sceneId: string) {
  if (!canPrepare(live, sceneId)) {
    throw new Error(`Scene ${sceneId} cannot be prepared`);
  }
  const file = parseMap(live.scenesMap.get(sceneId)?.file);
  // Undoing an earlier switch away from this scene would put its old map back on the board,
  // while the prepared one stays in its file until the next switch overwrites it.
  live.undoManager.clear();
  const doc = new Y.Doc();
  const room = createRoom(doc, preparedMeter(live, sceneId, doc));
  writeMap(room, file);
  room.undoManager.clear();
  let isUnsaved = false;
  doc.on("update", () => {
    isUnsaved = true;
  });

  // Outside undo, so undo in the shared room never takes back what was prepared.
  function save() {
    if (!canPrepare(live, sceneId)) {
      throw new Error(`Scene ${sceneId} cannot be saved`);
    }
    assertRoomFits(room.meter.bytes(), "this scene");
    const prepared = exportMap(room);
    live.doc.transact(
      () => putSceneFile(live, sceneId, prepared),
      OUTSIDE_UNDO,
    );
    isUnsaved = false;
  }

  function destroy() {
    room.undoManager.destroy();
    doc.destroy();
  }

  return {
    sceneId,
    room,
    isUnsaved: () => isUnsaved,
    canSave: () => canPrepare(live, sceneId),
    save,
    destroy,
  };
}
