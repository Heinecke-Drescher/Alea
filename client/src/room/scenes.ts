import { nanoid } from "nanoid";
import { createMapActions } from "./map";
import {
  createMapFiles,
  emptyMap,
  parseMap,
  writeMap,
  type MapFile,
} from "./roomFile";
import type { RoomStore } from "./roomStore";
import {
  megabytes,
  ROOM_SPACE_BYTES,
  RoomSpaceError,
  storedBytesAfter,
} from "./roomSpace";

export const ACTIVE_SCENE_KEY = "id";
export const FIRST_SCENE_NAME = "Scene 1";

export interface Scene {
  name: string;
  order: number;
  // The scene on the map has its content in the room; the others keep it as a map file.
  file?: MapFile;
}

export interface SceneTab {
  id: string;
  name: string;
  order: number;
}

// A room keeps its map as its only scene, without an entry, until its scenes are changed.
export const ONLY_SCENE: SceneTab = {
  id: "only",
  name: FIRST_SCENE_NAME,
  order: 0,
};

// Scenes come from other players, so only their known fields are used. Their files are
// checked when they are put on the map.
export function sceneTab(id: string, value: unknown): SceneTab | null {
  if (typeof value !== "object" || value === null) return null;
  const { name, order } = value as Partial<Scene>;
  if (typeof name !== "string") return null;
  if (typeof order !== "number" || !Number.isFinite(order)) return null;
  return { id, name, order };
}

export function sceneTabs(scenes: Record<string, unknown>) {
  return Object.entries(scenes)
    .flatMap(([id, value]) => sceneTab(id, value) ?? [])
    .sort((a, b) => a.order - b.order);
}

export function visibleSceneTabs(scenes: Record<string, unknown>) {
  const tabs = sceneTabs(scenes);
  return tabs.length > 0 ? tabs : [ONLY_SCENE];
}

function knownScene(store: RoomStore, id: string) {
  const tab = sceneTab(id, store.scenesMap.get(id));
  if (!tab) throw new Error(`Unknown scene ${id}`);
  return tab;
}

// Without a scene to come from, the map belonged to a scene that was deleted and goes with it.
function switchIn(
  store: RoomStore,
  fromId: string | null,
  toId: string,
  file: MapFile,
) {
  const { doc, scenesMap, activeSceneMap } = store;
  const to = knownScene(store, toId);
  const { exportMap } = createMapFiles(store, createMapActions(store));
  doc.transact(() => {
    if (fromId !== null) {
      const from = knownScene(store, fromId);
      scenesMap.set(fromId, {
        name: from.name,
        order: from.order,
        file: exportMap(),
      });
    }
    writeMap(store, file);
    scenesMap.set(toId, { name: to.name, order: to.order });
    activeSceneMap.set(ACTIVE_SCENE_KEY, toId);
  });
}

export function createScenes(store: RoomStore) {
  const { doc, scenesMap, activeSceneMap, undoManager } = store;

  function tabs() {
    return sceneTabs(scenesMap.toJSON());
  }

  // Another player may have deleted the scene on the map in the meantime.
  function activeSceneId() {
    const id = activeSceneMap.get(ACTIVE_SCENE_KEY);
    return id !== undefined && sceneTab(id, scenesMap.get(id)) ? id : null;
  }

  function keepMapAsScene() {
    const [first] = tabs();
    if (first) return first.id;
    const id = nanoid();
    scenesMap.set(id, { name: FIRST_SCENE_NAME, order: 0 });
    activeSceneMap.set(ACTIVE_SCENE_KEY, id);
    return id;
  }

  // Gives an old room's map its scene entry, so it can be renamed.
  function saveOnlyScene() {
    undoManager.stopCapturing();
    const id = doc.transact(keepMapAsScene);
    undoManager.stopCapturing();
    return id;
  }

  function addScene() {
    const id = nanoid();
    undoManager.stopCapturing();
    doc.transact(() => {
      keepMapAsScene();
      const existing = tabs();
      scenesMap.set(id, {
        name: `Scene ${existing.length + 1}`,
        order: Math.max(...existing.map((tab) => tab.order)) + 1,
        file: emptyMap(),
      });
    });
    undoManager.stopCapturing();
    return id;
  }

  function renameScene(id: string, name: string) {
    const { order } = knownScene(store, id);
    const { file } = scenesMap.get(id) as Partial<Scene>;
    scenesMap.set(id, { name, order, ...(file !== undefined && { file }) });
  }

  // One undo step, so undo brings back the scene that was on the map before.
  function switchWith(
    fromId: string | null,
    toId: string,
    andThen: (store: RoomStore) => void = () => {},
  ) {
    knownScene(store, toId);
    const file = parseMap(scenesMap.get(toId)?.file);
    const change = (target: RoomStore) =>
      target.doc.transact(() => {
        switchIn(target, fromId, toId, file);
        andThen(target);
      });
    const bytes = storedBytesAfter(doc, change);
    if (bytes > ROOM_SPACE_BYTES) {
      throw new RoomSpaceError(
        `With this scene the room would need ${megabytes(bytes)} MB, but it can hold at most ${megabytes(ROOM_SPACE_BYTES)} MB. Use smaller or fewer images.`,
      );
    }
    undoManager.stopCapturing();
    change(store);
    undoManager.stopCapturing();
  }

  function switchScene(id: string) {
    const fromId = activeSceneId();
    if (id !== fromId) switchWith(fromId, id);
  }

  // The scene on the map makes way for its neighbour first, in the same undo step.
  function deleteScene(id: string) {
    const all = tabs();
    const index = all.findIndex((tab) => tab.id === id);
    if (index === -1) throw new Error(`Unknown scene ${id}`);
    if (all.length === 1) throw new Error("The last scene cannot be deleted");
    if (id === activeSceneId()) {
      const neighbour = all[index - 1] ?? all[index + 1];
      if (!neighbour) throw new Error(`Scene ${id} has no neighbour`);
      switchWith(null, neighbour.id, (target) => target.scenesMap.delete(id));
      return;
    }
    undoManager.stopCapturing();
    scenesMap.delete(id);
    undoManager.stopCapturing();
  }

  return {
    activeSceneId,
    saveOnlyScene,
    addScene,
    renameScene,
    switchScene,
    deleteScene,
  };
}
