import { describe, expect, it } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  VIEW_MARGIN,
  centeredView,
  fittedView,
  wheelPixels,
  zoomedView,
  type View,
} from "./useBoardView";

const pointer = { x: 300, y: 200 };

function pointUnder(view: View) {
  return {
    x: (pointer.x - view.x) / view.scale,
    y: (pointer.y - view.y) / view.scale,
  };
}

describe("zoomedView", () => {
  it("keeps the point under the pointer in place", () => {
    const view = { scale: 1.5, x: 40, y: -60 };
    for (const deltaY of [-100, 100]) {
      const zoomed = zoomedView(view, pointer, deltaY);
      expect(pointUnder(zoomed).x).toBeCloseTo(pointUnder(view).x);
      expect(pointUnder(zoomed).y).toBeCloseTo(pointUnder(view).y);
    }
  });

  it("zooms in and out by the same step", () => {
    const view = { scale: 1, x: 0, y: 0 };
    const zoomedIn = zoomedView(view, pointer, -100);
    expect(zoomedIn.scale).toBeGreaterThan(1);
    expect(zoomedView(zoomedIn, pointer, 100).scale).toBeCloseTo(1);
  });

  it("zooms no more than one step per event", () => {
    const view = { scale: 1, x: 0, y: 0 };
    expect(zoomedView(view, pointer, -100).scale).toBeCloseTo(1.1);
    expect(zoomedView(view, pointer, -48).scale).toBeCloseTo(1.1);
  });

  it("zooms a small pinch step less than a wheel notch", () => {
    const view = { scale: 1, x: 0, y: 0 };
    const pinched = zoomedView(view, pointer, -2).scale;
    expect(pinched).toBeGreaterThan(1);
    expect(pinched).toBeLessThan(zoomedView(view, pointer, -100).scale);
  });

  it("stays between the smallest and the largest zoom", () => {
    const smallest = { scale: MIN_ZOOM, x: 0, y: 0 };
    const largest = { scale: MAX_ZOOM, x: 0, y: 0 };
    expect(zoomedView(smallest, pointer, 100).scale).toBe(MIN_ZOOM);
    expect(zoomedView(largest, pointer, -100).scale).toBe(MAX_ZOOM);
  });
});

describe("wheelPixels", () => {
  const page = { width: 1200, height: 800 };

  it("keeps pixels from a trackpad or most mouse wheels", () => {
    expect(wheelPixels({ deltaX: 4, deltaY: -12, deltaMode: 0 }, page)).toEqual(
      {
        x: 4,
        y: -12,
      },
    );
  });

  it("turns lines and pages into pixels", () => {
    expect(wheelPixels({ deltaX: 0, deltaY: 3, deltaMode: 1 }, page)).toEqual({
      x: 0,
      y: 48,
    });
    expect(wheelPixels({ deltaX: 1, deltaY: -1, deltaMode: 2 }, page)).toEqual({
      x: 1200,
      y: -800,
    });
  });
});

describe("fittedView", () => {
  const stage = { width: 1072, height: 848 };

  function onScreen(view: View, x: number, y: number) {
    return { x: view.x + x * view.scale, y: view.y + y * view.scale };
  }

  it("shows the whole map clear of the toolbar and the fit button", () => {
    const map = { x: -500, y: 0, width: 1500, height: 1000 };
    const view = fittedView(map, stage);
    const topLeft = onScreen(view, map.x, map.y);
    const bottomRight = onScreen(view, map.x + map.width, map.y + map.height);
    // The map fills the width exactly, up to rounding.
    expect(topLeft.x).toBeCloseTo(VIEW_MARGIN);
    expect(bottomRight.x).toBeCloseTo(stage.width - VIEW_MARGIN);
    expect(topLeft.y).toBeGreaterThan(VIEW_MARGIN);
    expect(bottomRight.y).toBeLessThan(stage.height - VIEW_MARGIN);
  });

  it("centers the map", () => {
    const map = { x: 0, y: 0, width: 500, height: 500 };
    const view = fittedView(map, stage);
    const middle = onScreen(view, 250, 250);
    expect(middle.x).toBeCloseTo(stage.width / 2);
    expect(middle.y).toBeCloseTo(stage.height / 2);
  });

  it("stays between the smallest and the largest zoom", () => {
    const tiny = { x: 0, y: 0, width: 10, height: 10 };
    const huge = { x: 0, y: 0, width: 100_000, height: 100_000 };
    expect(fittedView(tiny, stage).scale).toBe(MAX_ZOOM);
    expect(fittedView(huge, stage).scale).toBe(MIN_ZOOM);
  });
});

describe("centeredView", () => {
  it("puts the point in the middle of the stage and keeps the zoom", () => {
    const stage = { width: 1000, height: 600 };
    const view = centeredView(1.5, { x: -200, y: 300 }, stage);
    expect(view.scale).toBe(1.5);
    expect(view.x + -200 * view.scale).toBe(500);
    expect(view.y + 300 * view.scale).toBe(300);
  });
});
