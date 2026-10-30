import { describe, expect, it } from "vitest";
import {
  onePath,
  oneSpacing,
  stampedPlaces,
  STEP_SECONDS,
  TUMBLE_SECONDS,
  tumblePose,
} from "./natural1Tumble";

const area = { x: -500, y: 200, width: 1500, height: 1200 };
const spacing = oneSpacing(area);

describe("oneSpacing", () => {
  it("is limited by the height on a wide map", () => {
    expect(spacing).toBe((1200 * 0.5) / 6);
  });

  it("is limited by the width on a narrow map", () => {
    expect(oneSpacing({ x: 0, y: 0, width: 300, height: 2000 })).toBe(50);
  });
});

describe("onePath", () => {
  it("starts where the die landed", () => {
    const [first] = onePath({ x: 0, y: 600 }, spacing, area);
    expect(first).toEqual({ x: 0, y: 600 });
  });

  it("moves only one cell straight at each step", () => {
    const path = onePath({ x: 0, y: 600 }, spacing, area);
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1]!;
      const to = path[i]!;
      expect(Math.abs(to.x - from.x) + Math.abs(to.y - from.y)).toBeCloseTo(
        spacing,
      );
    }
  });

  it("keeps the whole 1 inside the area when the die landed at an edge", () => {
    for (const landed of [
      { x: -500, y: 200 },
      { x: 1000, y: 1400 },
    ]) {
      for (const { x, y } of onePath(landed, spacing, area)) {
        expect(x - spacing / 2).toBeGreaterThanOrEqual(area.x);
        expect(x + spacing / 2).toBeLessThanOrEqual(area.x + area.width);
        expect(y - spacing / 2).toBeGreaterThanOrEqual(area.y);
        expect(y + spacing / 2).toBeLessThanOrEqual(area.y + area.height);
      }
    }
  });
});

describe("tumblePose", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ];

  it("starts on the first place and ends on the last", () => {
    expect(tumblePose(path, 0)).toMatchObject({ x: 0, y: 0, reached: 1 });
    expect(tumblePose(path, 99)).toMatchObject({ x: 100, y: 100, reached: 3 });
  });

  it("stands on its edge halfway, thin along the way it tumbles", () => {
    const sideways = tumblePose(path, STEP_SECONDS / 2);
    expect(sideways.x).toBeCloseTo(50);
    expect(sideways.scaleX).toBeLessThan(1);
    expect(sideways.scaleY).toBe(1);
    const down = tumblePose(path, STEP_SECONDS * 1.5);
    expect(down.scaleX).toBe(1);
    expect(down.scaleY).toBeLessThan(1);
  });

  it("lies flat on each place it reaches", () => {
    expect(tumblePose(path, STEP_SECONDS)).toMatchObject({
      x: 100,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      reached: 2,
    });
  });

  it("takes as long as all steps of the 1 together", () => {
    const one = onePath({ x: 0, y: 600 }, spacing, area);
    expect(tumblePose(one, TUMBLE_SECONDS).reached).toBe(one.length);
    expect(tumblePose(one, TUMBLE_SECONDS - 0.01).reached).toBe(one.length - 1);
  });
});

describe("stampedPlaces", () => {
  it("stamps each place once and the whole 1 at the end", () => {
    const path = onePath({ x: 0, y: 600 }, spacing, area);
    const all = stampedPlaces(path, path.length);
    expect(all).toHaveLength(9);
    expect(stampedPlaces(path, 3)).toHaveLength(3);
    expect(stampedPlaces(path, 4)).toHaveLength(3);
  });
});
