import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { MAX_ROOM_BYTES } from "../../../shared/roomLimits";
import { BACKGROUND_IMAGE_ID } from "./background";
import { createRoom, type Room } from "./createRoom";
import { DEFAULT_MAP_BOUNDS } from "./grid";
import { emptyMap } from "./roomFile";
import { OUTSIDE_UNDO } from "./roomStore";
import { ACTIVE_SCENE_KEY, FIRST_SCENE_NAME, sceneTabs } from "./scenes";

const IMAGE = "data:image/webp;base64,AAAA";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function fillMap() {
  room.resize({ x: 0, y: 0, columns: 40, rows: 25 });
  room.paintCell(1, 1, "#ff0000");
  room.addToken("Goblin", IMAGE, { x: 3, y: 2 });
  room.hideCells({ x: 0, y: 0 }, { x: 1, y: 0 });
}

function tabs() {
  return sceneTabs(room.scenesMap.toJSON());
}

function activeScene() {
  return room.activeSceneMap.get(ACTIVE_SCENE_KEY);
}

function activeSceneId() {
  const id = activeScene();
  if (!id) throw new Error("Expected an active scene");
  return id;
}

describe("scenes", () => {
  it("keeps a room without scenes as it is", () => {
    fillMap();
    expect(room.scenesMap.size).toBe(0);
    expect(activeScene()).toBeUndefined();
  });

  it("makes the current map the first scene when a second one is added", () => {
    fillMap();
    const before = room.exportMap();
    const id = room.addScene();
    const [first, second] = tabs();
    expect(tabs()).toHaveLength(2);
    expect(first?.name).toBe(FIRST_SCENE_NAME);
    expect(activeScene()).toBe(first?.id);
    expect(second).toEqual({ id, name: "Scene 2", order: 1 });
    expect(room.exportMap()).toEqual(before);
  });

  it("makes the current map the first scene also next to invalid entries", () => {
    room.scenesMap.set("broken", { name: 3 } as never);
    const id = room.addScene();
    expect(tabs()).toEqual([
      { id: activeSceneId(), name: FIRST_SCENE_NAME, order: 0 },
      { id, name: "Scene 2", order: 1 },
    ]);
  });

  it("adds new scenes at the end", () => {
    room.addScene();
    const id = room.addScene();
    expect(tabs().at(-1)).toEqual({ id, name: "Scene 3", order: 2 });
  });

  it("puts an empty map on the board for a new scene", () => {
    fillMap();
    room.switchScene(room.addScene());
    expect(room.exportMap()).toEqual(emptyMap());
    expect(room.mapBounds()).toEqual(DEFAULT_MAP_BOUNDS);
  });

  it("brings each map back unchanged when switching back", () => {
    fillMap();
    const first = room.exportMap();
    const secondId = room.addScene();
    const firstId = activeSceneId();
    room.switchScene(secondId);
    room.paintCell(4, 4, "#00ff00");
    const second = room.exportMap();
    room.switchScene(firstId);
    expect(room.exportMap()).toEqual(first);
    expect(activeScene()).toBe(firstId);
    room.switchScene(secondId);
    expect(room.exportMap()).toEqual(second);
  });

  it("keeps the content of a scene only once in the room", () => {
    fillMap();
    const secondId = room.addScene();
    const firstId = activeSceneId();
    room.switchScene(secondId);
    expect(room.scenesMap.get(secondId)?.file).toBeUndefined();
    expect(room.scenesMap.get(firstId)?.file).toBeDefined();
  });

  it("does nothing when switching to the scene on the map", () => {
    room.addScene();
    const firstId = activeSceneId();
    const before = room.doc.toJSON();
    room.switchScene(firstId);
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("undoes a switch in one step", () => {
    fillMap();
    const secondId = room.addScene();
    const before = room.doc.toJSON();
    room.switchScene(secondId);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("refuses an unknown scene", () => {
    room.addScene();
    expect(() => room.switchScene("unknown")).toThrow("Unknown scene");
  });

  it("refuses a scene whose map is not valid and keeps the room as it was", () => {
    fillMap();
    const secondId = room.addScene();
    room.scenesMap.set(secondId, {
      name: "Broken",
      order: 1,
      file: { ...emptyMap(), cells: [{ x: 999, y: 0, color: "#000" }] },
    });
    const before = room.doc.toJSON();
    expect(() => room.switchScene(secondId)).toThrow("not a valid map file");
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("refuses a switch that would overfill the room and keeps the room as it was", () => {
    const secondId = room.addScene();
    room.doc.transact(
      () =>
        room.imagesMap.set(
          BACKGROUND_IMAGE_ID,
          `data:image/webp;base64,${"A".repeat(0.6 * MAX_ROOM_BYTES)}`,
        ),
      OUTSIDE_UNDO,
    );
    room.scenesMap.set(secondId, {
      name: "Scene 2",
      order: 1,
      file: {
        ...emptyMap(),
        background: `data:image/webp;base64,${"B".repeat(0.6 * MAX_ROOM_BYTES)}`,
      },
    });
    const before = room.doc.toJSON();
    expect(() => room.switchScene(secondId)).toThrow("can hold at most");
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("renames a scene and keeps its map", () => {
    const id = room.addScene();
    room.renameScene(id, "Dungeon");
    expect(tabs().at(-1)).toEqual({ id, name: "Dungeon", order: 1 });
    expect(room.scenesMap.get(id)?.file).toEqual(emptyMap());
  });

  it("gives an old room's map its scene entry for renaming", () => {
    fillMap();
    const before = room.exportMap();
    const id = room.saveOnlyScene();
    expect(tabs()).toEqual([{ id, name: FIRST_SCENE_NAME, order: 0 }]);
    expect(activeScene()).toBe(id);
    expect(room.saveOnlyScene()).toBe(id);
    expect(room.exportMap()).toEqual(before);
  });

  it("deletes a scene that is not on the map in one undo step", () => {
    const secondId = room.addScene();
    const before = room.doc.toJSON();
    room.deleteScene(secondId);
    expect(tabs().map((tab) => tab.id)).toEqual([activeSceneId()]);
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("puts the scene before it on the map when the scene on the map is deleted", () => {
    const secondId = room.addScene();
    const thirdId = room.addScene();
    room.switchScene(secondId);
    room.paintCell(4, 4, "#00ff00");
    room.switchScene(thirdId);
    room.deleteScene(thirdId);
    expect(activeScene()).toBe(secondId);
    expect(room.cellsMap.has("4,4")).toBe(true);
    expect(room.scenesMap.has(thirdId)).toBe(false);
  });

  it("puts the next scene on the map when the first scene is deleted", () => {
    fillMap();
    const secondId = room.addScene();
    const firstId = activeSceneId();
    room.deleteScene(firstId);
    expect(activeScene()).toBe(secondId);
    expect(room.exportMap()).toEqual(emptyMap());
  });

  it("undoes deleting the scene on the map in one step", () => {
    fillMap();
    room.addScene();
    const before = room.doc.toJSON();
    room.deleteScene(activeSceneId());
    room.undoManager.undo();
    expect(room.doc.toJSON()).toEqual(before);
  });

  it("refuses to delete the last scene", () => {
    const id = room.saveOnlyScene();
    expect(() => room.deleteScene(id)).toThrow("last scene");
  });

  it("drops the map of a scene that another player deleted when switching away", () => {
    const secondId = room.addScene();
    const firstId = activeSceneId();
    const thirdId = room.addScene();
    room.scenesMap.delete(firstId);
    expect(room.activeSceneId()).toBeNull();
    room.switchScene(thirdId);
    expect(activeScene()).toBe(thirdId);
    expect(room.scenesMap.has(firstId)).toBe(false);
    expect(room.scenesMap.get(secondId)?.file).toEqual(emptyMap());
  });

  it("lists only scenes with a name and an order", () => {
    expect(
      sceneTabs({
        a: { name: "A", order: 1 },
        b: { name: "B", order: 0, extra: "<script>" },
        c: { name: 3, order: 2 },
        d: { name: "D", order: Number.NaN },
        e: null,
      }),
    ).toEqual([
      { id: "b", name: "B", order: 0 },
      { id: "a", name: "A", order: 1 },
    ]);
  });
});
