import { describe, expect, it } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
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
