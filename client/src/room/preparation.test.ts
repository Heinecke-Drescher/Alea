import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { canPrepare, createPreparation } from "./preparation";
import { emptyMap, parseMap } from "./roomFile";
import { RoomSpaceError } from "./roomSpace";
import { OUTSIDE_UNDO } from "./roomStore";
import { ACTIVE_SCENE_KEY, sceneTabs } from "./scenes";
import { IMAGE } from "./testRoom";

function imageOf(bytes: number) {
  return `data:image/webp;base64,${"A".repeat(bytes)}`;
}

let live: Room;
let liveSceneId: string;
let sceneId: string;

beforeEach(() => {
  live = createRoom(new Y.Doc());
  live.paintCell(1, 1, "#ff0000");
  sceneId = live.addScene();
  liveSceneId = activeSceneId();
});

function activeSceneId() {
  const id = live.activeSceneMap.get(ACTIVE_SCENE_KEY);
  if (!id) throw new Error("Expected an active scene");
  return id;
}

function sceneFile(id: string) {
  return parseMap(live.scenesMap.get(id)?.file);
}

describe("preparation", () => {
  it("opens the scene's map in a room of its own", () => {
    live.switchScene(sceneId);
    live.paintCell(2, 2, "#00ff00");
    const prepared = live.exportMap();
    live.switchScene(liveSceneId);
    const preparation = createPreparation(live, sceneId);
    expect(preparation.room.exportMap()).toEqual(prepared);
    expect(preparation.room.doc).not.toBe(live.doc);
  });

  it("starts without unsaved changes and without undo steps", () => {
    const preparation = createPreparation(live, sceneId);
    expect(preparation.isUnsaved()).toBe(false);
    expect(preparation.room.undoManager.undoStack).toHaveLength(0);
  });

  it("keeps changes away from the shared room until they are saved", () => {
    const before = live.exportMap();
    const preparation = createPreparation(live, sceneId);
    preparation.room.addToken("Goblin", IMAGE, { x: 3, y: 2 });
    expect(preparation.isUnsaved()).toBe(true);
    expect(live.exportMap()).toEqual(before);
    expect(sceneFile(sceneId)).toEqual(emptyMap());
  });

  it("saves the prepared map as the scene's file", () => {
    const preparation = createPreparation(live, sceneId);
    preparation.room.addToken("Goblin", IMAGE, { x: 3, y: 2 });
    preparation.save();
    expect(preparation.isUnsaved()).toBe(false);
    expect(sceneFile(sceneId)).toEqual(preparation.room.exportMap());
    live.switchScene(sceneId);
    expect(live.exportMap()).toEqual(preparation.room.exportMap());
  });

  it("keeps a name given to the scene while it was prepared", () => {
    const preparation = createPreparation(live, sceneId);
    live.renameScene(sceneId, "Cave");
    preparation.save();
    const tab = sceneTabs(live.scenesMap.toJSON()).find(
      (scene) => scene.id === sceneId,
    );
    expect(tab?.name).toBe("Cave");
  });

  it("keeps saving out of undo in the shared room", () => {
    const preparation = createPreparation(live, sceneId);
    live.paintCell(5, 5, "#0000ff");
    preparation.room.paintCell(2, 2, "#00ff00");
    preparation.save();
    live.undo();
    expect(live.cellsMap.has("5,5")).toBe(false);
    expect(sceneFile(sceneId)).toEqual(preparation.room.exportMap());
  });

  it("keeps an earlier switch away from the scene from being undone", () => {
    live.switchScene(sceneId);
    const preparation = createPreparation(live, liveSceneId);
    preparation.room.paintCell(7, 7, "#00ff00");
    preparation.save();
    live.undo();
    expect(activeSceneId()).toBe(sceneId);
    expect(sceneFile(liveSceneId)).toEqual(preparation.room.exportMap());
  });

  it("undoes only what was changed in the preparation", () => {
    const preparation = createPreparation(live, sceneId);
    preparation.room.paintCell(2, 2, "#00ff00");
    preparation.room.undo();
    expect(preparation.room.exportMap()).toEqual(emptyMap());
  });

  it("does not prepare the scene on the map", () => {
    expect(canPrepare(live, liveSceneId)).toBe(false);
    expect(() => createPreparation(live, liveSceneId)).toThrow();
  });

  it("stops saving when the scene is deleted", () => {
    const preparation = createPreparation(live, sceneId);
    live.deleteScene(sceneId);
    expect(preparation.canSave()).toBe(false);
    expect(() => preparation.save()).toThrow();
  });

  it("stops saving when the scene is put on the map", () => {
    const preparation = createPreparation(live, sceneId);
    live.switchScene(sceneId);
    expect(preparation.canSave()).toBe(false);
    expect(() => preparation.save()).toThrow();
  });

  it("measures images against the shared room", () => {
    live.doc.transact(
      () => live.imagesMap.set("filler", imageOf(3 * 1024 ** 2)),
      OUTSIDE_UNDO,
    );
    const preparation = createPreparation(live, sceneId);
    expect(() =>
      preparation.room.assertSpaceForImage(imageOf(2 * 1024 ** 2)),
    ).toThrow(RoomSpaceError);
    expect(() =>
      preparation.room.assertSpaceForImage(imageOf(1024 ** 2)),
    ).not.toThrow();
  });

  it("refuses to save what the shared room cannot hold", () => {
    const preparation = createPreparation(live, sceneId);
    preparation.room.setBackground(imageOf(3 * 1024 ** 2));
    live.doc.transact(
      () => live.imagesMap.set("filler", imageOf(3 * 1024 ** 2)),
      OUTSIDE_UNDO,
    );
    expect(() => preparation.save()).toThrow(RoomSpaceError);
    expect(sceneFile(sceneId)).toEqual(emptyMap());
    expect(preparation.isUnsaved()).toBe(true);
  });
});
