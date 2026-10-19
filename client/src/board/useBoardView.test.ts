import { describe, expect, it } from "vitest";
import { MAX_ZOOM, MIN_ZOOM, zoomedView, type View } from "./useBoardView";

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
    for (const zoomIn of [true, false]) {
      const zoomed = zoomedView(view, pointer, zoomIn);
      expect(pointUnder(zoomed).x).toBeCloseTo(pointUnder(view).x);
      expect(pointUnder(zoomed).y).toBeCloseTo(pointUnder(view).y);
    }
  });

  it("zooms in and out by the same step", () => {
    const view = { scale: 1, x: 0, y: 0 };
    const zoomedIn = zoomedView(view, pointer, true);
    expect(zoomedIn.scale).toBeGreaterThan(1);
    expect(zoomedView(zoomedIn, pointer, false).scale).toBeCloseTo(1);
  });

  it("stays between the smallest and the largest zoom", () => {
    const smallest = { scale: MIN_ZOOM, x: 0, y: 0 };
    const largest = { scale: MAX_ZOOM, x: 0, y: 0 };
    expect(zoomedView(smallest, pointer, false).scale).toBe(MIN_ZOOM);
    expect(zoomedView(largest, pointer, true).scale).toBe(MAX_ZOOM);
  });
});
