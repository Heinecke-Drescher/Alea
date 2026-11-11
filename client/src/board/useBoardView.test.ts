import { describe, expect, it } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  VIEW_MARGIN,
  centeredView,
  fittedAxisShift,
  fittedView,
  glideOffset,
  glideVelocity,
  pinchedView,
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

describe("pinchedView", () => {
  const view = { scale: 1.5, x: 40, y: -60 };

  function mapPoint(at: { x: number; y: number }, on: View) {
    return { x: (at.x - on.x) / on.scale, y: (at.y - on.y) / on.scale };
  }

  it("moves the map with the center between the fingers", () => {
    const from = { center: { x: 100, y: 100 }, distance: 80 };
    const to = { center: { x: 130, y: 90 }, distance: 80 };
    const pinched = pinchedView(view, from, to);
    expect(pinched.scale).toBe(view.scale);
    expect(mapPoint(to.center, pinched).x).toBeCloseTo(
      mapPoint(from.center, view).x,
    );
    expect(mapPoint(to.center, pinched).y).toBeCloseTo(
      mapPoint(from.center, view).y,
    );
  });

  it("zooms by how far the fingers spread, around their center", () => {
    const from = { center: { x: 100, y: 100 }, distance: 80 };
    const to = { center: { x: 100, y: 100 }, distance: 120 };
    const pinched = pinchedView(view, from, to);
    expect(pinched.scale).toBeCloseTo(2.25);
    expect(mapPoint(to.center, pinched).x).toBeCloseTo(
      mapPoint(from.center, view).x,
    );
    expect(mapPoint(to.center, pinched).y).toBeCloseTo(
      mapPoint(from.center, view).y,
    );
  });

  it("stays between the smallest and the largest zoom", () => {
    const center = { x: 0, y: 0 };
    const spread = pinchedView(
      view,
      { center, distance: 10 },
      { center, distance: 1000 },
    );
    const closed = pinchedView(
      view,
      { center, distance: 1000 },
      { center, distance: 1 },
    );
    expect(spread.scale).toBe(MAX_ZOOM);
    expect(closed.scale).toBe(MIN_ZOOM);
  });

  it("keeps the view when both fingers started on the same spot", () => {
    const center = { x: 50, y: 50 };
    expect(
      pinchedView(view, { center, distance: 0 }, { center, distance: 40 }),
    ).toBe(view);
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
  const uncovered = { right: 0, bottom: 0 };

  function onScreen(view: View, x: number, y: number) {
    return { x: view.x + x * view.scale, y: view.y + y * view.scale };
  }

  it("shows the whole map clear of the toolbar and the fit button", () => {
    const map = { x: -500, y: 0, width: 1500, height: 1000 };
    const view = fittedView(map, stage, uncovered);
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
    const view = fittedView(map, stage, uncovered);
    const middle = onScreen(view, 250, 250);
    expect(middle.x).toBeCloseTo(stage.width / 2);
    expect(middle.y).toBeCloseTo(stage.height / 2);
  });

  it("keeps the map clear of panels over the right edge", () => {
    const map = { x: 0, y: 0, width: 1500, height: 1000 };
    const covered = 264;
    const view = fittedView(map, stage, { right: covered, bottom: 0 });
    const topLeft = onScreen(view, map.x, map.y);
    const bottomRight = onScreen(view, map.x + map.width, map.y + map.height);
    expect(topLeft.x).toBeCloseTo(VIEW_MARGIN);
    expect(bottomRight.x).toBeCloseTo(stage.width - covered);
  });

  it("tells how far left of the stage's middle the map's middle lies", () => {
    const map = { x: 0, y: 0, width: 500, height: 500 };
    for (const right of [0, 264]) {
      const covered = { right, bottom: 0 };
      const middle = onScreen(fittedView(map, stage, covered), 250, 250);
      expect(middle.x).toBeCloseTo(stage.width / 2 - fittedAxisShift(covered));
    }
  });

  it("keeps the map clear of a panel over the bottom edge", () => {
    const map = { x: 0, y: 0, width: 1000, height: 1000 };
    const covered = 400;
    const view = fittedView(map, stage, { right: 0, bottom: covered });
    const topLeft = onScreen(view, map.x, map.y);
    const bottomRight = onScreen(view, map.x + map.width, map.y + map.height);
    expect(topLeft.y).toBeCloseTo(VIEW_MARGIN);
    expect(bottomRight.y).toBeCloseTo(stage.height - covered);
  });

  it("stays between the smallest and the largest zoom", () => {
    const tiny = { x: 0, y: 0, width: 10, height: 10 };
    const huge = { x: 0, y: 0, width: 100_000, height: 100_000 };
    expect(fittedView(tiny, stage, uncovered).scale).toBe(MAX_ZOOM);
    expect(fittedView(huge, stage, uncovered).scale).toBe(MIN_ZOOM);
  });
});

describe("glideVelocity", () => {
  it("does not glide after a slow release", () => {
    expect(glideVelocity({ x: 200, y: 0 }, 1000)).toBeNull();
  });

  it("keeps the speed of a release that glides less than the limit", () => {
    expect(glideVelocity({ x: 1000, y: 500 }, 1000)).toEqual({
      x: 1000,
      y: 500,
    });
  });

  it("slows a fast release down to the farthest glide", () => {
    const velocity = glideVelocity({ x: 30000, y: 40000 }, 1000);
    if (!velocity) throw new Error("A fast release glides");
    const end = glideOffset(velocity, Infinity);
    expect(Math.hypot(end.x, end.y)).toBeCloseTo(1000);
    expect(velocity.y / velocity.x).toBeCloseTo(40 / 30);
  });
});

describe("glideOffset", () => {
  const velocity = { x: 2000, y: -1000 };

  it("starts where the finger let go", () => {
    const start = glideOffset(velocity, 0);
    expect(start.x).toBeCloseTo(0);
    expect(start.y).toBeCloseTo(0);
  });

  it("moves on in the direction of the release and slows down", () => {
    const early = glideOffset(velocity, 0.1);
    const later = glideOffset(velocity, 0.2);
    expect(early.x).toBeGreaterThan(0);
    expect(early.y).toBeLessThan(0);
    expect(later.x - early.x).toBeLessThan(early.x);
  });

  it("comes to rest", () => {
    expect(glideOffset(velocity, 0.1).isDone).toBe(false);
    expect(glideOffset(velocity, 3).isDone).toBe(true);
  });
});

describe("centeredView", () => {
  it("puts the point in the middle of the stage and keeps the zoom", () => {
    const stage = { x: 0, y: 0, width: 1000, height: 600 };
    const view = centeredView(1.5, { x: -200, y: 300 }, stage);
    expect(view.scale).toBe(1.5);
    expect(view.x + -200 * view.scale).toBe(500);
    expect(view.y + 300 * view.scale).toBe(300);
  });

  it("puts the point in the middle of an area that does not start at the corner", () => {
    const area = { x: 0, y: 68, width: 400, height: 200 };
    const view = centeredView(1, { x: 10, y: 20 }, area);
    expect(view.x + 10).toBe(200);
    expect(view.y + 20).toBe(168);
  });
});
