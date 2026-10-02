import { describe, expect, it } from "vitest";
import { CELL_SIZE, DEFAULT_MAP_BOUNDS, mapRect } from "../room/grid";
import {
  areaSelection,
  boxBetween,
  cellOffset,
  clipToMap,
  linesBounds,
  NO_SELECTION,
  pixelOffset,
  selectedArea,
  selectedStrokeIds,
  strokesSelection,
  withoutStroke,
  withPressedStroke,
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

describe("stroke selection rules", () => {
  const area = areaSelection({ x: 0, y: 0, width: 10, height: 10 });

  it("selects only the pressed stroke", () => {
    expect(withPressedStroke(strokesSelection(["a"]), "b", false)).toEqual(
      strokesSelection(["b"]),
    );
  });

  it("adds the pressed stroke while the add key is held", () => {
    expect(withPressedStroke(strokesSelection(["a"]), "b", true)).toEqual(
      strokesSelection(["a", "b"]),
    );
  });

  it("keeps the selection when pressing a selected stroke", () => {
    const selection = strokesSelection(["a", "b"]);
    expect(withPressedStroke(selection, "b", false)).toBe(selection);
    expect(withPressedStroke(selection, "b", true)).toBe(selection);
  });

  it("replaces an area with the pressed stroke", () => {
    expect(withPressedStroke(area, "a", true)).toEqual(strokesSelection(["a"]));
  });

  it("removes a stroke and ends up with no selection when empty", () => {
    expect(withoutStroke(strokesSelection(["a", "b"]), "a")).toEqual(
      strokesSelection(["b"]),
    );
    expect(withoutStroke(strokesSelection(["a"]), "a")).toBe(NO_SELECTION);
  });

  it("reads area and strokes only from the matching kind", () => {
    expect(selectedArea(area)).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    expect(selectedStrokeIds(area)).toEqual([]);
    expect(selectedArea(strokesSelection(["a"]))).toBeNull();
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
