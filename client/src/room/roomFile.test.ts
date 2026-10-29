import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { MAX_ROOM_BYTES } from "../../../shared/roomLimits";
import { BACKGROUND_IMAGE_ID } from "./background";
import { createRoom, type Room } from "./createRoom";
import { DEFAULT_MAP_BOUNDS } from "./grid";
import { MAP_IMAGE_KEY } from "./mapImage";
import {
  checkMapFileSize,
  MAX_MAP_FILE_BYTES,
  parseMapFile,
  type MapFile,
} from "./roomFile";
import { megabytes } from "./roomSpace";
import type { AreaShape } from "./shapes";

const IMAGE = "data:image/webp;base64,AAAA";
const SQUARE: AreaShape = {
  kind: "square",
  from: { x: 0, y: 0 },
  to: { x: 50, y: 50 },
};
const SQUARE_STROKE = {
  color: "#0000ff",
  points: [0, 0, 50, 0, 50, 50, 0, 50],
  closed: true,
  shape: SQUARE,
};

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function fillRoom(target: Room) {
  target.resize({ x: -2, y: 0, columns: 20, rows: 15 });
  target.paintCell(1, 1, "#ff0000");
  target.addStroke("#000000", [0, 0, 10, 10]);
  target.addStroke("#00ff00", [5, 5, 20, 20], true);
  target.addShape("#0000ff", SQUARE, false);
  target.addToken("Goblin", IMAGE, { x: 3, y: 2 });
  const [token] = target.tokensMap.values();
  if (!token) throw new Error("Expected a token");
  target.toggleEffect(token.id, "dead");
  target.setBackground(IMAGE);
  target.hideCells({ x: 0, y: 0 }, { x: 1, y: 0 });
}

function validFile(): MapFile {
  fillRoom(room);
  return room.exportMap();
}

describe("map files", () => {
  it("exports the map without room ids", () => {
    expect(validFile()).toEqual({
      app: "alea",
      version: 1,
      bounds: { x: -2, y: 0, columns: 20, rows: 15 },
      cells: [{ x: 1, y: 1, color: "#ff0000" }],
      strokes: expect.arrayContaining([
        { color: "#000000", points: [0, 0, 10, 10] },
        { color: "#00ff00", points: [5, 5, 20, 20], overFog: true },
        SQUARE_STROKE,
      ]),
      tokens: [
        {
          name: "Goblin",
          x: 3,
          y: 2,
          size: 1,
          effects: ["dead"],
          image: IMAGE,
        },
      ],
      background: IMAGE,
      fog: expect.arrayContaining([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]),
    });
  });

  it("brings an exported map into another room unchanged", () => {
    const file = parseMapFile(JSON.stringify(validFile()));
    const other = createRoom(new Y.Doc());
    other.importMap(file);
    expect(other.exportMap()).toEqual(file);
  });

  it("exports only known stroke data from other players", () => {
    room.strokesMap.set("foreign", {
      id: "foreign",
      color: "#000000",
      points: [0, 0, 10, 10],
      overFog: "yes",
      extra: 1,
    } as never);
    const file = room.exportMap();
    expect(file.strokes).toEqual([
      { color: "#000000", points: [0, 0, 10, 10] },
    ]);
    expect(() => parseMapFile(JSON.stringify(file))).not.toThrow();
  });

  it("takes a shape's outline from its shape data", () => {
    const stroke = { ...SQUARE_STROKE, points: [0, 0, 1, 1] };
    const file = parseMapFile(
      JSON.stringify({ ...validFile(), strokes: [stroke] }),
    );
    expect(file.strokes).toEqual([SQUARE_STROKE]);
  });

  it("replaces what was on the map before", () => {
    const file = validFile();
    const other = createRoom(new Y.Doc());
    other.paintCell(5, 5, "#0000ff");
    other.addToken("Orc", "data:image/webp;base64,BBBB");
    other.importMap(file);
    expect(other.cellsMap.has("5,5")).toBe(false);
    expect(Array.from(other.tokensMap.values(), (t) => t.name)).toEqual([
      "Goblin",
    ]);
    expect(other.imagesMap.size).toBe(2);
  });

  it("undoes an import in one step, map size included", () => {
    const file = validFile();
    const other = createRoom(new Y.Doc());
    other.paintCell(5, 5, "#0000ff");
    const before = other.doc.toJSON();
    other.importMap(file);
    other.undoManager.undo();
    expect(other.doc.toJSON()).toEqual(before);
    expect(other.mapBounds()).toEqual(DEFAULT_MAP_BOUNDS);
  });

  it("keeps resizing out of undo", () => {
    room.resize({ x: 0, y: 0, columns: 40, rows: 30 });
    room.undoManager.undo();
    expect(room.mapBounds()).toEqual({ x: 0, y: 0, columns: 40, rows: 30 });
  });

  it("imports a map without background", () => {
    const file = { ...validFile(), background: null };
    room.importMap(parseMapFile(JSON.stringify(file)));
    expect(room.imagesMap.has(BACKGROUND_IMAGE_ID)).toBe(false);
  });

  it("brings a map image into another room", () => {
    room.setMapImage(IMAGE, 20, 15);
    const file = parseMapFile(JSON.stringify(room.exportMap()));
    expect(file.mapImage).toEqual({
      image: IMAGE,
      bounds: { x: 0, y: 0, columns: 20, rows: 15 },
    });
    const other = createRoom(new Y.Doc());
    other.importMap(file);
    expect(other.exportMap()).toEqual(file);
  });

  it("removes the old map image when the file has none", () => {
    const file = validFile();
    const other = createRoom(new Y.Doc());
    other.setMapImage(IMAGE, 20, 15);
    other.importMap(file);
    expect(other.imagesMap.has(MAP_IMAGE_KEY)).toBe(false);
    expect(other.settingsMap.has(MAP_IMAGE_KEY)).toBe(false);
  });

  it.each<[string, (file: MapFile) => unknown]>([
    ["another app", (file) => ({ ...file, app: "other" })],
    ["a newer version", (file) => ({ ...file, version: 2 })],
    [
      "an invalid map size",
      (file) => ({ ...file, bounds: { x: 0, y: 0, columns: 3, rows: 20 } }),
    ],
    [
      "a cell off the map",
      (file) => ({ ...file, cells: [{ x: 99, y: 0, color: "#000" }] }),
    ],
    [
      "a stroke with an odd point list",
      (file) => ({ ...file, strokes: [{ color: "#000", points: [0, 0, 1] }] }),
    ],
    [
      "a stroke closed by something other than true",
      (file) => ({
        ...file,
        strokes: [{ color: "#000", points: [0, 0, 1, 1], closed: "yes" }],
      }),
    ],
    [
      "a shape of unknown kind",
      (file) => ({
        ...file,
        strokes: [{ ...SQUARE_STROKE, shape: { ...SQUARE, kind: "hexagon" } }],
      }),
    ],
    [
      "a shape without size",
      (file) => ({
        ...file,
        strokes: [{ ...SQUARE_STROKE, shape: { ...SQUARE, to: SQUARE.from } }],
      }),
    ],
    [
      "a shape too large to draw",
      (file) => ({
        ...file,
        strokes: [
          {
            ...SQUARE_STROKE,
            shape: {
              ...SQUARE,
              from: { x: -1e308, y: 0 },
              to: { x: 1e308, y: 0 },
            },
          },
        ],
      }),
    ],
    [
      "a token too large",
      (file) => ({ ...file, tokens: [{ ...file.tokens[0], size: 11 }] }),
    ],
    [
      "a token with an image from the web",
      (file) => ({
        ...file,
        tokens: [{ ...file.tokens[0], image: "https://example.com/a.png" }],
      }),
    ],
    [
      "an unknown effect",
      (file) => ({
        ...file,
        tokens: [{ ...file.tokens[0], effects: ["flying"] }],
      }),
    ],
    ["fog off the map", (file) => ({ ...file, fog: [{ x: -10, y: 0 }] })],
    [
      "a map image from the web",
      (file) => ({
        ...file,
        mapImage: { image: "https://example.com/map.png", bounds: file.bounds },
      }),
    ],
    [
      "a map image of invalid size",
      (file) => ({
        ...file,
        mapImage: { image: IMAGE, bounds: { ...file.bounds, rows: 3 } },
      }),
    ],
  ])("rejects a file with %s", (_, change) => {
    const json = JSON.stringify(change(validFile()));
    expect(() => parseMapFile(json)).toThrow("not a valid map file");
  });

  it("rejects files that are no JSON", () => {
    expect(() => parseMapFile("not json")).toThrow("not a valid map file");
  });

  it("rejects files too large to read", () => {
    expect(() => checkMapFileSize(MAX_MAP_FILE_BYTES)).not.toThrow();
    expect(() => checkMapFileSize(MAX_MAP_FILE_BYTES + 1)).toThrow(
      `larger than ${megabytes(MAX_MAP_FILE_BYTES)} MB`,
    );
  });
});

describe("space for an imported map", () => {
  function image(length: number) {
    return `data:image/webp;base64,${"A".repeat(length)}`;
  }

  it("refuses a map that would overfill the room and keeps the room as it was", () => {
    const file = { ...validFile(), background: image(MAX_ROOM_BYTES) };
    const before = room.exportMap();
    expect(() => room.importMap(file)).toThrow("can hold at most");
    expect(room.exportMap()).toEqual(before);
  });

  it("counts only what stays, since the import replaces the old map", () => {
    // The new background alone is larger than the space left before the import.
    const file = { ...validFile(), background: image(200_000) };
    room.imagesMap.set(BACKGROUND_IMAGE_ID, image(MAX_ROOM_BYTES - 100_000));
    expect(() => room.importMap(file)).not.toThrow();
  });
});
