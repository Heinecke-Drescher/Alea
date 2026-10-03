import { describe, expect, it } from "vitest";
import { CELL_SIZE, DEFAULT_MAP_BOUNDS, mapRect } from "../room/grid";
import {
  areaSelection,
  boxBetween,
  cellOffset,
  clipBounds,
  clipToMap,
  itemsSelection,
  linesBounds,
  NO_ITEMS,
  NO_SELECTION,
  pixelOffset,
  selectedArea,
  selectedItems,
  withoutItem,
  withPressedItem,
} from "./selection";

const defaultMap = DEFAULT_MAP_BOUNDS;
const { width: mapWidth, height: mapHeight } = mapRect(defaultMap);

describe("boxBetween", () => {
  it("spans from the start to the end point", () => {
    expect(boxBetween({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  it("also works when dragging up and to the left", () => {
    expect(boxBetween({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });
});

describe("item selection rules", () => {
  const area = areaSelection({ x: 0, y: 0, width: 10, height: 10 });
  const strokes = (ids: string[]) =>
    itemsSelection({ ...NO_ITEMS, strokes: ids });

  it("selects only the pressed item", () => {
    expect(withPressedItem(strokes(["a"]), "strokes", "b", false)).toEqual(
      strokes(["b"]),
    );
    expect(withPressedItem(strokes(["a"]), "tokens", "t", false)).toEqual(
      itemsSelection({ ...NO_ITEMS, tokens: ["t"] }),
    );
  });

  it("adds the pressed item while the add key is held", () => {
    expect(withPressedItem(strokes(["a"]), "strokes", "b", true)).toEqual(
      strokes(["a", "b"]),
    );
    expect(withPressedItem(strokes(["a"]), "tokens", "t", true)).toEqual(
      itemsSelection({ ...NO_ITEMS, strokes: ["a"], tokens: ["t"] }),
    );
  });

  it("keeps the selection when pressing a selected item", () => {
    const selection = strokes(["a", "b"]);
    expect(withPressedItem(selection, "strokes", "b", false)).toBe(selection);
    expect(withPressedItem(selection, "strokes", "b", true)).toBe(selection);
  });

  it("replaces an area with the pressed item", () => {
    expect(withPressedItem(area, "strokes", "a", true)).toEqual(strokes(["a"]));
  });

  it("removes an item and ends up with no selection when empty", () => {
    expect(withoutItem(strokes(["a", "b"]), "strokes", "a")).toEqual(
      strokes(["b"]),
    );
    expect(withoutItem(strokes(["a"]), "strokes", "a")).toBe(NO_SELECTION);
  });

  it("reads area and items only from the matching kind", () => {
    expect(selectedArea(area)).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    expect(selectedItems(area)).toEqual(NO_ITEMS);
    expect(selectedArea(strokes(["a"]))).toBeNull();
  });
});

describe("clipBounds", () => {
  const stroke = { color: "#000000", points: [-30, 10, 20, 400] };

  it("spans the strokes when there are only strokes", () => {
    expect(clipBounds({ cells: [], tokens: [], strokes: [stroke] })).toEqual({
      x: -30,
      y: 10,
      width: 50,
      height: 390,
    });
  });

  it("spans only cells and tokens when there are any", () => {
    const clip = {
      cells: [{ x: 1, y: 2, color: "#ff0000" }],
      tokens: [{ name: "Ogre", image: "", x: 3, y: 0, size: 2 }],
      strokes: [stroke],
    };
    expect(clipBounds(clip)).toEqual({
      x: CELL_SIZE,
      y: 0,
      width: 4 * CELL_SIZE,
      height: 3 * CELL_SIZE,
    });
  });
});

describe("linesBounds", () => {
  it("spans all points of all lines", () => {
    expect(
      linesBounds([
        [10, 40, 30, 20],
        [50, 5, 15, 60],
      ]),
    ).toEqual({ x: 10, y: 5, width: 40, height: 55 });
  });

  it("refuses lines without points", () => {
    expect(() => linesBounds([])).toThrow();
  });
});

describe("clipToMap", () => {
  it("keeps a box inside the map unchanged", () => {
    const box = { x: 10, y: 20, width: 30, height: 40 };
    expect(clipToMap(box, defaultMap)).toEqual(box);
  });

  it("cuts off the parts outside the map", () => {
    expect(
      clipToMap(
        { x: -10, y: mapHeight - 20, width: 50, height: 100 },
        defaultMap,
      ),
    ).toEqual({ x: 0, y: mapHeight - 20, width: 40, height: 20 });
  });

  it("returns null for a box completely outside the map", () => {
    expect(
      clipToMap({ x: mapWidth + 1, y: 0, width: 10, height: 10 }, defaultMap),
    ).toBeNull();
  });
});

describe("pixelOffset", () => {
  const bounds = { x: 60, y: 60, width: 80, height: 80 };

  it("moves the top left corner to the position", () => {
    expect(pixelOffset(bounds, { x: 75, y: 33 }, defaultMap)).toEqual({
      dx: 15,
      dy: -27,
    });
  });

  it("keeps the bounds on the map", () => {
    expect(pixelOffset(bounds, { x: -1000, y: mapHeight }, defaultMap)).toEqual(
      {
        dx: -60,
        dy: mapHeight - 140,
      },
    );
  });

  it("puts lines larger than the map at the position", () => {
    const wide = { x: 0, y: 60, width: mapWidth + 100, height: 80 };
    expect(pixelOffset(wide, { x: 300, y: -1000 }, defaultMap)).toEqual({
      dx: 300,
      dy: -60,
    });
  });
});

describe("maps that do not start at zero", () => {
  const map = { x: -4, y: -2, columns: 10, rows: 10 };

  it("clips a box to the map's left and top edge", () => {
    expect(
      clipToMap({ x: -500, y: -500, width: 1000, height: 1000 }, map),
    ).toEqual({ x: -200, y: -100, width: 500, height: 500 });
  });

  it("lets areas and lines move into negative coordinates", () => {
    const area = { x: 0, y: 0, width: 50, height: 50 };
    expect(cellOffset(area, { x: -1000, y: -1000 }, map)).toEqual({
      dx: -4,
      dy: -2,
    });
    expect(pixelOffset(area, { x: -1000, y: -1000 }, map)).toEqual({
      dx: -200,
      dy: -100,
    });
  });
});

describe("cellOffset", () => {
  const area = { x: 60, y: 60, width: 80, height: 80 };

  it("rounds the dragged position to whole cells", () => {
    expect(
      cellOffset(
        area,
        { x: 60 + 1.4 * CELL_SIZE, y: 60 - 0.6 * CELL_SIZE },
        defaultMap,
      ),
    ).toEqual({
      dx: 1,
      dy: -1,
    });
  });

  it("keeps the area on the map", () => {
    expect(
      cellOffset(area, { x: -1000, y: mapHeight + 1000 }, defaultMap),
    ).toEqual({
      dx: -1,
      dy: Math.floor((mapHeight - 140) / CELL_SIZE),
    });
    expect(cellOffset(area, { x: mapWidth, y: -1000 }, defaultMap).dx).toBe(
      Math.floor((mapWidth - 140) / CELL_SIZE),
    );
  });
});
