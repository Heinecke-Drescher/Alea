import { describe, expect, it } from "vitest";
import {
  CRACK_SECONDS,
  crackPoints,
  grownCrack,
  onePath,
  oneSpacing,
  stampedPlaces,
  STEP_SECONDS,
  STUMBLE_SECONDS,
  stumblePose,
  TOPPLE_SECONDS,
  toppleAngle,
  TOPPLED_SECONDS,
  topplePivot,
  TUMBLE_SECONDS,
  tumblePose,
} from "./natural1Tumble";

const area = { x: -500, y: 200, width: 1500, height: 1200 };
const spacing = oneSpacing(area);
const { trail, missed } = onePath({ x: 0, y: 600 }, spacing, area);

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
    expect(trail[0]).toEqual({ x: 0, y: 600 });
  });

  it("moves only one cell straight at each step, the missed one included", () => {
    const path = [...trail, missed];
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1]!;
      const to = path[i]!;
      expect(Math.abs(to.x - from.x) + Math.abs(to.y - from.y)).toBeCloseTo(
        spacing,
      );
    }
  });

  it("misses the right end of the foot", () => {
    const last = trail.at(-1)!;
    expect(missed).toEqual({ x: last.x + spacing, y: last.y });
  });

  it("keeps the whole 1 inside the area when the die landed at an edge", () => {
    for (const landed of [
      { x: -500, y: 200 },
      { x: 1000, y: 1400 },
    ]) {
      const path = onePath(landed, spacing, area);
      for (const { x, y } of [...path.trail, path.missed]) {
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

  it("takes as long as all steps of the trail together", () => {
    expect(tumblePose(trail, TUMBLE_SECONDS).reached).toBe(trail.length);
    expect(tumblePose(trail, TUMBLE_SECONDS - 0.01).reached).toBe(
      trail.length - 1,
    );
  });
});

describe("stumblePose", () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 0 };

  it("rises onto its edge towards the missed place", () => {
    const onEdge = stumblePose(from, to, 0.3);
    expect(onEdge.x).toBeCloseTo(50);
    expect(onEdge.scaleX).toBeCloseTo(0.4);
  });

  it("never gets over its edge", () => {
    for (let seconds = 0; seconds <= STUMBLE_SECONDS; seconds += 0.01) {
      expect(stumblePose(from, to, seconds).x).toBeLessThan(65);
    }
  });

  it("falls back and lies flat where it came from", () => {
    const fallen = stumblePose(from, to, STUMBLE_SECONDS);
    expect(fallen.x).toBeCloseTo(0);
    expect(fallen.scaleX).toBeCloseTo(1);
    expect(fallen.scaleY).toBe(1);
  });
});

describe("stampedPlaces", () => {
  it("stamps each place once", () => {
    expect(stampedPlaces(trail, 3)).toHaveLength(3);
    expect(stampedPlaces(trail, 4)).toHaveLength(3);
    expect(stampedPlaces(trail, trail.length)).toHaveLength(8);
  });
});

describe("crack", () => {
  const points = crackPoints(trail, spacing);
  const die = trail.at(-1)!;
  const top = Math.min(...trail.map(({ y }) => y)) - spacing / 2;

  it("runs from where the die fell back up to the top of the 1", () => {
    expect(points[0]).toEqual(die);
    expect(points.at(-1)!.y).toBeCloseTo(top);
  });

  it("zigzags around the stem but stays within a cell", () => {
    const swings = crackPoints(trail, spacing, () => 0).slice(1);
    expect(swings.every(({ x }) => x < die.x)).toBe(true);
    for (const { x } of points) {
      expect(Math.abs(x - die.x)).toBeLessThanOrEqual(spacing / 2);
    }
  });

  it("grows from the die upwards", () => {
    expect(grownCrack(points, 0)).toEqual([points[0]]);
    const half = grownCrack(points, CRACK_SECONDS / 2);
    expect(half.at(-1)!.y).toBeCloseTo((die.y + top) / 2);
    expect(grownCrack(points, CRACK_SECONDS)).toEqual(points);
  });
});

describe("topple", () => {
  it("turns around the bottom right corner of the stem", () => {
    const last = trail.at(-1)!;
    expect(topplePivot(trail, spacing)).toEqual({
      x: last.x + spacing / 2,
      y: last.y + spacing / 2,
    });
  });

  it("falls faster and faster until it lies on the slogan", () => {
    expect(toppleAngle(0, 82)).toBe(0);
    expect(toppleAngle(TOPPLE_SECONDS / 2, 82)).toBeLessThan(82 / 2);
    expect(toppleAngle(TOPPLE_SECONDS, 82)).toBe(82);
    expect(toppleAngle(TOPPLED_SECONDS, 82)).toBeCloseTo(82);
    expect(toppleAngle(99, 82)).toBeCloseTo(82);
  });

  it("bounces back up but never falls through the slogan", () => {
    for (let seconds = 0; seconds <= TOPPLED_SECONDS; seconds += 0.01) {
      expect(toppleAngle(seconds, 82)).toBeLessThanOrEqual(82);
    }
    expect(toppleAngle(TOPPLE_SECONDS + 0.1, 82)).toBeLessThan(82);
  });
});
